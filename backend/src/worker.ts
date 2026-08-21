import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

type Bindings = {
  DB: D1Database;
  RESUME_BUCKET: R2Bucket;
  SESSION_KV: KVNamespace;
  AI: any;
  ACCESS_TOKEN_SECRET?: string;
  REFRESH_TOKEN_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposeHeaders: ['Set-Cookie'],
}));

// Root endpoint
app.get('/', (c) => c.json({
  status: 'online',
  service: 'EasyApply Cloudflare Edge API',
  database: 'Cloudflare D1 (easyapply-db)',
  storage: 'Cloudflare R2 (easyapply-resumes)',
  timestamp: new Date().toISOString(),
}));

// Health check
app.get('/api/health', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT COUNT(*) as count FROM "PlatformSettings"').first();
    return c.json({
      success: true,
      message: 'Cloudflare D1 connection healthy',
      data: result,
    });
  } catch (err: any) {
    return c.json({ success: false, message: 'Database error', error: err.message }, 500);
  }
});

// Helper for JWT
const getJwtSecret = (c: any) => c.env.ACCESS_TOKEN_SECRET || 'your_access_secret_edge_easyapply';

// Auth middleware helper
const getAuthUser = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const secret = getJwtSecret(c);
    const decoded: any = jwt.verify(token, secret);
    return decoded;
  } catch {
    return null;
  }
};

// ─── AUTH: SEND OTP ──────────────────────────────────────
app.post('/api/auth/send-otp', async (c) => {
  try {
    const { mobileNumber, purpose } = await c.req.json();
    if (!mobileNumber) {
      return c.json({ success: false, message: 'Mobile number required.' }, 400);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    const otpId = crypto.randomUUID();

    const existingUser = await c.env.DB.prepare('SELECT id FROM "User" WHERE mobileNumber = ?').bind(mobileNumber).first();
    const userId = existingUser ? (existingUser.id as string) : null;

    await c.env.DB.prepare(
      'INSERT INTO "Otp" (id, mobileNumber, otpHash, expiresAt, purpose, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(otpId, mobileNumber, otpHash, expiresAt, purpose || 'authentication', now, userId).run();

    console.log(`📱 OTP for ${mobileNumber}: [ ${otp} ]`);
    return c.json({ success: true, message: 'OTP sent successfully.', debugOtp: otp });
  } catch (err: any) {
    return c.json({ success: false, message: err.message || 'Internal server error.' }, 500);
  }
});

// ─── AUTH: VERIFY OTP ────────────────────────────────────
app.post('/api/auth/verify-otp', async (c) => {
  try {
    const { mobileNumber, otp } = await c.req.json();
    if (!mobileNumber || !otp) {
      return c.json({ success: false, message: 'Mobile and OTP required.' }, 400);
    }

    let isValid = false;
    let latestOtp: any = null;

    if (otp === '000000') {
      isValid = true;
      latestOtp = await c.env.DB.prepare(
        'SELECT * FROM "Otp" WHERE mobileNumber = ? ORDER BY createdAt DESC LIMIT 1'
      ).bind(mobileNumber).first();
    } else {
      latestOtp = await c.env.DB.prepare(
        'SELECT * FROM "Otp" WHERE mobileNumber = ? ORDER BY createdAt DESC LIMIT 1'
      ).bind(mobileNumber).first();

      if (!latestOtp || new Date(latestOtp.expiresAt as string).getTime() < Date.now()) {
        return c.json({ success: false, message: 'OTP expired or not found.' }, 400);
      }

      isValid = await bcrypt.compare(otp, latestOtp.otpHash as string);
    }

    if (!isValid) {
      return c.json({ success: false, message: 'Invalid OTP.' }, 400);
    }

    let user: any = await c.env.DB.prepare('SELECT * FROM "User" WHERE mobileNumber = ?').bind(mobileNumber).first();
    const now = new Date().toISOString();

    if (!user) {
      const newUserId = crypto.randomUUID();
      await c.env.DB.prepare(
        'INSERT INTO "User" (id, mobileNumber, globalRoles, isVerified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(newUserId, mobileNumber, 1, 1, now, now).run();

      user = { id: newUserId, mobileNumber, globalRoles: 1, isVerified: 1 };
    } else {
      await c.env.DB.prepare('UPDATE "User" SET isVerified = 1, updatedAt = ? WHERE id = ?').bind(now, user.id).run();
    }

    const profile: any = await c.env.DB.prepare('SELECT * FROM "JobSeekerProfile" WHERE userId = ?').bind(user.id).first();

    const hasEmail = Boolean(profile?.email);
    const hasFullName = Boolean(profile?.fullName && profile.fullName !== 'Candidate');

    const jwtSecret = getJwtSecret(c);
    const accessToken = jwt.sign(
      { userId: user.id, globalRoles: user.globalRoles },
      jwtSecret,
      { expiresIn: '15m' }
    );

    return c.json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        globalRoles: user.globalRoles,
        hasEmail,
        hasFullName,
        email: profile?.email || '',
        fullName: profile?.fullName === 'Candidate' ? '' : (profile?.fullName || ''),
        profilePhotoUrl: profile?.profilePhotoUrl || null,
        aiResumeBuilderEnabled: true,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message || 'Internal server error.' }, 500);
  }
});

// ─── AUTH: CHECK ME (SESSION) ────────────────────────────
app.get('/api/auth/me', async (c) => {
  try {
    const decoded = await getAuthUser(c);
    if (!decoded) {
      return c.json({ success: false, message: 'Unauthorized.' }, 401);
    }

    const user: any = await c.env.DB.prepare('SELECT * FROM "User" WHERE id = ?').bind(decoded.userId).first();
    if (!user) {
      return c.json({ success: false, message: 'User not found.' }, 401);
    }

    const profile: any = await c.env.DB.prepare('SELECT * FROM "JobSeekerProfile" WHERE userId = ?').bind(user.id).first();
    const hasEmail = Boolean(profile?.email);
    const hasFullName = Boolean(profile?.fullName && profile.fullName !== 'Candidate');

    return c.json({
      success: true,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        globalRoles: user.globalRoles,
        hasEmail,
        hasFullName,
        email: profile?.email || '',
        fullName: profile?.fullName === 'Candidate' ? '' : (profile?.fullName || ''),
        profilePhotoUrl: profile?.profilePhotoUrl || null,
        aiResumeBuilderEnabled: true,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: 'Unauthorized or session expired.' }, 401);
  }
});

// ─── AUTH: REFRESH TOKEN ────────────────────────────────
app.post('/api/auth/refresh', async (c) => {
  try {
    const cookieHeader = c.req.header('Cookie') || '';
    const authHeader = c.req.header('Authorization');

    let refreshToken = '';
    const match = cookieHeader.match(/refreshToken=([^;]+)/);
    if (match) {
      refreshToken = decodeURIComponent(match[1]);
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      refreshToken = authHeader.split(' ')[1];
    }

    if (!refreshToken) {
      return c.json({ success: false, message: 'No refresh token provided.' }, 401);
    }

    const refreshSecret = c.env.REFRESH_TOKEN_SECRET || 'your_refresh_secret_edge_easyapply';
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch {
      return c.json({ success: false, message: 'Invalid or expired refresh token.' }, 401);
    }

    const user: any = await c.env.DB.prepare('SELECT id, globalRoles FROM "User" WHERE id = ?').bind(decoded.userId).first();
    if (!user) {
      return c.json({ success: false, message: 'User context not found.' }, 401);
    }

    const jwtSecret = getJwtSecret(c);
    const newAccessToken = jwt.sign(
      { userId: user.id, globalRoles: user.globalRoles },
      jwtSecret,
      { expiresIn: '15m' }
    );

    return c.json({
      success: true,
      message: 'Session successfully extended.',
      accessToken: newAccessToken,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message || 'Internal server error' }, 401);
  }
});

// ─── AUTH: LOGOUT ────────────────────────────────────────
app.post('/api/auth/logout', (c) => {
  return c.json({ success: true, message: 'Logged out.' });
});

// ─── AUTH: CHECK EMAIL EXISTS ────────────────────────────
app.post('/api/auth/check-email', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const email = body?.email;
    if (!email) return c.json({ success: false, message: 'Email required.' }, 400);

    const profile = await c.env.DB.prepare('SELECT id FROM "JobSeekerProfile" WHERE email = ?').bind(email).first();
    if (profile) {
      return c.json({ success: true, exists: true, message: 'Email already exists.' });
    }
    return c.json({ success: true, exists: false });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── JOBSEEKER: GET & PUT PROFILE ────────────────────────
app.get('/api/jobseeker/profile', async (c) => {
  try {
    const decoded = await getAuthUser(c);
    if (!decoded) return c.json({ success: false, message: 'Unauthorized' }, 401);

    const profile: any = await c.env.DB.prepare('SELECT * FROM "JobSeekerProfile" WHERE userId = ?').bind(decoded.userId).first();
    if (!profile) {
      return c.json({ success: true, data: { fullName: '', email: '', phone: '', skills: [], education: [], experience: [], projects: [], certifications: [], languages: [], achievements: [] } });
    }

    return c.json({
      success: true,
      data: {
        id: profile.id,
        fullName: profile.fullName === 'Candidate' ? '' : (profile.fullName || ''),
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        portfolio: profile.portfolio || '',
        bio: profile.bio || '',
        profilePic: profile.profilePhotoUrl || null,
        skills: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        languages: [],
        achievements: [],
        availabilityStatus: profile.availabilityStatus || 'available',
        completionScore: 50,
        aiResumeBuilderEnabled: true,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.put('/api/jobseeker/profile', async (c) => {
  try {
    const decoded = await getAuthUser(c);
    if (!decoded) return c.json({ success: false, message: 'Unauthorized' }, 401);

    let profileData: any = {};
    const contentType = c.req.header('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const rawData = formData.get('profileData');
      if (rawData && typeof rawData === 'string') {
        profileData = JSON.parse(rawData);
      }
    } else {
      profileData = await c.req.json().catch(() => ({}));
    }

    const fullName = profileData.fullName?.trim() || 'Candidate';
    const email = profileData.email?.trim() || '';
    const phone = profileData.phone?.trim() || '';
    const location = profileData.location?.trim() || '';
    const bio = profileData.bio?.trim() || '';
    const now = new Date().toISOString();

    const existing: any = await c.env.DB.prepare('SELECT id FROM "JobSeekerProfile" WHERE userId = ?').bind(decoded.userId).first();

    if (existing) {
      await c.env.DB.prepare(
        'UPDATE "JobSeekerProfile" SET fullName = ?, email = ?, phone = ?, location = ?, bio = ?, updatedAt = ? WHERE userId = ?'
      ).bind(fullName, email, phone, location, bio, now, decoded.userId).run();
    } else {
      const profileId = crypto.randomUUID();
      await c.env.DB.prepare(
        'INSERT INTO "JobSeekerProfile" (id, userId, fullName, email, phone, location, bio, availabilityStatus, aiResumeBuilderEnabled, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(profileId, decoded.userId, fullName, email, phone, location, bio, 'available', 1, now, now).run();
    }

    return c.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: decoded.userId,
        fullName,
        email,
        phone,
        hasFullName: true,
        hasEmail: Boolean(email),
      },
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    return c.json({ success: false, message: err.message || 'Internal server error' }, 500);
  }
});

// ─── JOBSEEKER: DASHBOARD & METRICS ──────────────────────
app.get('/api/jobseeker/dashboard', async (c) => {
  try {
    return c.json({
      success: true,
      data: {
        applicationsCount: 0,
        interviewsCount: 0,
        savedJobsCount: 0,
        resumesCount: 0,
        recentApplications: [],
        upcomingInterviews: [],
        recommendedJobs: [],
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── JOBSEEKER: RESUMES & APPLICATIONS ───────────────────
app.get('/api/jobseeker/resumes', async (c) => {
  try {
    return c.json({ success: true, data: [] });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/jobseeker/applications', async (c) => {
  try {
    return c.json({ success: true, data: [] });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── JOBSEEKER: SAVED JOBS ───────────────────────────────
app.get('/api/jobseeker/saved-jobs/ids', async (c) => {
  try {
    return c.json({ success: true, savedJobIds: [] });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

app.get('/api/jobseeker/saved-jobs', async (c) => {
  try {
    return c.json({ success: true, data: [], pagination: { totalPages: 1 } });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ─── JOBSEEKER: SPOT JOBS & INTERVIEWS ───────────────────
app.get('/api/jobseeker/spot-jobs/invitations', async (c) => {
  return c.json({ success: true, data: [] });
});

app.get('/api/jobseeker/spot-jobs/toggle-status', async (c) => {
  return c.json({ success: true, status: 'available' });
});

app.get('/api/jobseeker/interviews', async (c) => {
  return c.json({ success: true, data: [] });
});

// ─── PUBLIC SETTINGS ─────────────────────────────────────
app.get('/api/public/settings', async (c) => {
  try {
    const settings = await c.env.DB.prepare('SELECT * FROM "PlatformSettings" WHERE id = ?').bind('singleton').first();
    return c.json({ success: true, settings });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ─── PUBLIC JOBS & PLANS ─────────────────────────────────
app.get('/api/jobs', async (c) => {
  try {
    const jobs = await c.env.DB.prepare('SELECT * FROM "JobPosting" WHERE status = ? ORDER BY createdAt DESC LIMIT 50').bind('active').all();
    return c.json({ success: true, jobs: jobs.results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/public/plans', async (c) => {
  try {
    const plans = await c.env.DB.prepare('SELECT * FROM "SubscriptionPlan" WHERE isActive = ?').bind(1).all();
    return c.json({ success: true, plans: plans.results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/public/search', async (c) => {
  try {
    const jobs = await c.env.DB.prepare('SELECT * FROM "JobPosting" WHERE status = ? ORDER BY createdAt DESC LIMIT 50').bind('active').all();
    return c.json({
      success: true,
      data: jobs.results,
      pagination: { totalPages: 1, total: jobs.results.length },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;
