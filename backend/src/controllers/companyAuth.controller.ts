import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.ts';
import { generateOTP } from '../utils/generateOtp.ts';
import { issueSessionCookies } from '../utils/cookie.ts';
import { sendVerificationEmail } from '../utils/email.ts';
import { ROLES } from '../constants/roles.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';

const bufferToBase64 = (buffer: Buffer, mimeType: string) =>
  `data:${mimeType};base64,${buffer.toString('base64')}`;

const sendCompanyVerification = async (companyId: string, email: string) => {
  const token = jwt.sign({ companyId }, JWT_SECRET, { expiresIn: '24h' });
  await sendVerificationEmail(email, token);
};

// Step 1: Verify mobile via OTP
export const sendCompanyOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, companyName } = req.body;
    if (!mobileNumber || !companyName)
      return res.status(400).json({ success: false, message: 'Mobile and company name required.' });

    const existingCompany = await prisma.company.findUnique({ where: { name: companyName.trim() } });
    if (existingCompany)
      return res.status(400).json({ success: false, message: 'Company name already registered.' });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otp.create({
      data: { mobileNumber, otpHash, expiresAt, purpose: 'company_registration' },
    });

    console.log(`🟢 COMPANY OTP for ${mobileNumber}: [ ${otp} ]`);
    return res.status(200).json({ success: true, message: 'OTP sent.' });
  } catch (error) {
    console.error('sendCompanyOtp error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Step 2: Verify OTP → preRegistrationToken
export const verifyCompanyOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp)
      return res.status(400).json({ success: false, message: 'Mobile and OTP required.' });

    const latestOtp = await prisma.otp.findFirst({
      where: { mobileNumber, purpose: 'company_registration' },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp || latestOtp.expiresAt < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired or not found.' });

    const isValid = await bcrypt.compare(otp, latestOtp.otpHash);
    if (!isValid)
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });

    const token = jwt.sign({ mobileNumber }, JWT_SECRET, { expiresIn: '15m' });
    return res.status(200).json({ success: true, message: 'Mobile verified.', preRegistrationToken: token });
  } catch (error) {
    console.error('verifyCompanyOtp error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Step 3: Register — email+password stored on Company, not User
export const registerCompany = async (req: Request, res: Response) => {
  try {
    if (!req.body.companyData)
      return res.status(400).json({ success: false, message: 'Missing companyData.' });

    const { companyName, industry, companySize, email, password, gstNumber, mobileNumber } =
      JSON.parse(req.body.companyData);

    if (!email || !password || !mobileNumber)
      return res.status(400).json({ success: false, message: 'Email, password, and mobile required.' });

    const normalizedEmail = email.toLowerCase().trim();

    const [existingCompany, emailTaken] = await Promise.all([
      prisma.company.findUnique({ where: { name: companyName?.trim() } }),
      prisma.company.findUnique({ where: { email: normalizedEmail } }),
    ]);

    if (existingCompany)
      return res.status(409).json({ success: false, message: 'Company name already registered.' });
    if (emailTaken)
      return res.status(409).json({ success: false, message: 'Company email already in use.' });

    // Find or create User by mobileNumber (no email/password on User)
    let adminUser = await prisma.user.findUnique({ where: { mobileNumber } });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: { mobileNumber, isVerified: true, globalRoles: ROLES.JOB_SEEKER },
      });
    }

    const alreadyInCompany = await prisma.teamMember.findFirst({ where: { userId: adminUser.id } });
    if (alreadyInCompany)
      return res.status(400).json({ success: false, message: 'User already linked to a company.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const logoUrl = req.file ? bufferToBase64(req.file.buffer, req.file.mimetype) : null;

    const company = await prisma.$transaction(async (tx) => {
      // Add COMPANY_ADMIN bit to existing roles (preserve JOB_SEEKER if set)
      const newGlobalRoles = adminUser!.globalRoles | ROLES.COMPANY_ADMIN;
      await tx.user.update({
        where: { id: adminUser!.id },
        data: { globalRoles: newGlobalRoles, isVerified: true },
      });

      return tx.company.create({
        data: {
          name: companyName,
          email: normalizedEmail,
          password: passwordHash,
          industry,
          size: companySize,
          logoUrl,
          registrationNumber: gstNumber,
          isVerified: false,
          verificationBadge: 'none',
          teamMembers: {
            create: { userId: adminUser!.id, roles: ROLES.COMPANY_ADMIN, status: 'active' },
          },
        },
      });
    });

    try { await sendCompanyVerification(company.id, normalizedEmail); } catch (e) {
      console.error('Verification email failed (non-fatal):', e);
    }

    return res.status(201).json({
      success: true,
      message: 'Company registered. Check email to verify.',
    });
  } catch (error) {
    console.error('registerCompany error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed.' });
  }
};

// Step 4: Click email link → Company.isVerified = true
export const verifyCompanyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string')
      return res.status(400).json({ success: false, message: 'Verification token missing.' });

    let decoded: { companyId: string };
    try { decoded = jwt.verify(token, JWT_SECRET) as { companyId: string }; }
    catch { return res.status(403).json({ success: false, message: 'Token expired or invalid.' }); }

    const company = await prisma.company.findUnique({ where: { id: decoded.companyId } });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });

    if (!company.isVerified) {
      await prisma.company.update({
        where: { id: decoded.companyId },
        data: { isVerified: true, verificationBadge: 'verified' },
      });
    }

    const adminMember = await prisma.teamMember.findFirst({
      where: { companyId: decoded.companyId, status: 'active' },
      include: { user: { select: { id: true, globalRoles: true } } },
      orderBy: { createdAt: 'asc' },
    });

    if (!adminMember)
      return res.status(404).json({ success: false, message: 'Admin record missing.' });

    const accessToken = issueSessionCookies(res, { userId: adminMember.userId, globalRoles: adminMember.user.globalRoles });
    return res.status(200).json({ success: true, message: 'Email verified. Logged in.', accessToken });
  } catch (error) {
    console.error('verifyCompanyEmail error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed.' });
  }
};

// Login: Company email + password (not User credentials)
export const companyLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required.' });

    const normalizedEmail = email.trim().toLowerCase();

    const company = await prisma.company.findUnique({ where: { email: normalizedEmail } });
    if (!company || !company.password)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const isValid = await bcrypt.compare(password, company.password);
    if (!isValid)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    if (!company.isVerified) {
      try { await sendCompanyVerification(company.id, normalizedEmail); } catch (_) {}
      return res.status(403).json({
        success: false,
        emailVerified: false,
        message: 'Email not verified. A fresh link has been sent.',
      });
    }

    // Get the admin TeamMember to issue a session
    const adminMember = await prisma.teamMember.findFirst({
      where: { companyId: company.id, status: 'active' },
      include: { 
        user: { 
          select: { 
            id: true, 
            globalRoles: true, 
            mobileNumber: true,
            jobSeekerProfile: {
              select: { fullName: true, email: true }
            }
          } 
        } 
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!adminMember)
      return res.status(422).json({ success: false, message: 'No company workspace found.' });

    const accessToken = issueSessionCookies(res, { userId: adminMember.user.id, globalRoles: adminMember.user.globalRoles });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: { 
        id: adminMember.user.id, 
        globalRoles: adminMember.user.globalRoles,
        email: adminMember.user.jobSeekerProfile?.email || (adminMember.user.mobileNumber.includes('@') ? adminMember.user.mobileNumber : company.email),
        name: adminMember.user.jobSeekerProfile?.fullName || (adminMember.user.mobileNumber.includes('@') ? adminMember.user.mobileNumber.split('@')[0] : 'Admin')
      },
      company: { id: company.id, name: company.name, email: company.email, logoUrl: company.logoUrl || null },
    });
  } catch (error) {
    console.error('companyLogin error:', error);
    return res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

export const resendCompanyVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required.' });

    const normalizedEmail = email.trim().toLowerCase();
    const company = await prisma.company.findUnique({ where: { email: normalizedEmail } });

    if (!company)
      return res.status(200).json({ success: true, message: 'If this account exists, a link has been sent.' });
    if (company.isVerified)
      return res.status(400).json({ success: false, message: 'Email already verified.' });

    await sendCompanyVerification(company.id, normalizedEmail);
    return res.status(200).json({ success: true, message: 'Verification link resent.' });
  } catch (error) {
    console.error('resendCompanyVerificationEmail error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend.' });
  }
};

export const checkCompanySession = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized session trace context.' });
    }

    // Include all active workspace tracking scopes
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobSeekerProfile: {
          select: { fullName: true, email: true }
        },
        teamMemberships: {
          where: { status: 'active' },
          include: { 
            company: { 
              select: { id: true, name: true, email: true, isVerified: true, logoUrl: true } 
            } 
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User identity path not tracked.' });
    }
    
    if (!user.teamMemberships.length) {
      return res.status(403).json({ success: false, message: 'No active company linkages tracked for profile.' });
    }

    // 1. Target the primary/active selection slot workspace context
    const activeMembership = user.teamMemberships[0];
    if (!activeMembership) {
      return res.status(403).json({ success: false, message: 'No active company linkages tracked for profile.' });
    }

    // 2. Map all workspaces the user has access to, including their respective bitmask privileges
    const allRolesSummary = user.teamMemberships.map(m => ({
      companyId: m.company.id,
      companyName: m.company.name,
      companyRoles: m.roles
    }));

    return res.status(200).json({
      success: true,
      isAuthenticated: true,
      user: { 
        id: user.id, 
        globalRoles: user.globalRoles, 
        companyRoles: activeMembership.roles, // Active working context mask
        allWorkspaces: allRolesSummary,        // Collection array containing all memberships
        email: user.jobSeekerProfile?.email || (user.mobileNumber.includes('@') ? user.mobileNumber : activeMembership.company.email),
        name: user.jobSeekerProfile?.fullName || (user.mobileNumber.includes('@') ? user.mobileNumber.split('@')[0] : 'Admin')
      },
      company: { 
        id: activeMembership.company.id, 
        name: activeMembership.company.name, 
        email: activeMembership.company.email,
        logoUrl: activeMembership.company.logoUrl || null
      },
    });
  } catch (error) {
    console.error('checkCompanySession runtime tracking trace failure:', error);
    return res.status(500).json({ success: false, message: 'Session evaluation pipeline failed.' });
  }
};














// ─────────────────────────────────────────────────────────────────────
export const getMyCompanyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized execution context.' 
      });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: 'active' },
      select: { companyId: true }
    });

    if (!membership) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active business organizational context found.' 
      });
    }

    const company = await prisma.company.findUnique({
      where: { id: membership.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        industry: true,
        size: true,
        logoUrl: true,
        registrationNumber: true,
        isVerified: true,
        verificationBadge: true,
        tagline: true,
        services: true,
        products: true,
        seoKeywords: true,
        coreValues: true,
        gallery: true,
        youtubeLink: true,
        officeLocations: true,
        socialMedia: true,
        corporateLink: true,
        createdAt: true,
        updatedAt: true,
        // Get all company team members
        teamMembers: {
          select: {
            id: true,
            userId: true,
            roles: true,
            status: true,
            user: {
              select: {
                id: true,
                mobileNumber: true
              }
            }
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found.' 
      });
    }

    const mobileNumber = company.teamMembers.find(m => m.userId === userId)?.user?.mobileNumber || null;

    const sanitizedCompany = {
      ...company,
      mobileNumber, // Include mobile from User
      services: company.services || [],
      seoKeywords: company.seoKeywords || [],
      coreValues: company.coreValues || [],
      gallery: company.gallery || [],
      products: company.products || {},
      officeLocations: company.officeLocations || [],
      socialMedia: company.socialMedia || {},
      teamMembers: company.teamMembers // Return list of team members to frontend
    };

    return res.status(200).json({
      success: true,
      data: sanitizedCompany
    });

  } catch (error) {
    console.error('getMyCompanyProfile error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile.' 
    });
  }
};

// ─────────────────────────────────────────────────────────────────────
// UPDATE BASIC COMPANY PROFILE (excluding mobile, email, password, logo)
// ─────────────────────────────────────────────────────────────────────
export const updateCompanyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: 'active' },
      select: { companyId: true }
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'No company association.' });
    }

    const {
      name,
      industry,
      size,
      registrationNumber,
      tagline,
      services,
      products,
      seoKeywords,
      coreValues,
      gallery,
      youtubeLink,
      officeLocations,
      socialMedia,
      corporateLink
    } = req.body;

    // Validate unique name if changing
    if (name) {
      const conflict = await prisma.company.findFirst({
        where: { name: name.trim(), NOT: { id: membership.companyId } }
      });
      if (conflict) {
        return res.status(400).json({ success: false, message: 'Company name already taken.' });
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id: membership.companyId },
      data: {
        name: name?.trim() || undefined,
        industry: industry || undefined,
        size: size || undefined,
        registrationNumber: registrationNumber || undefined,
        tagline: tagline?.trim() || undefined,
        services: Array.isArray(services) ? services : undefined,
        products: products !== undefined ? products : undefined,
        seoKeywords: Array.isArray(seoKeywords) ? seoKeywords.map((k: string) => k.trim()) : undefined,
        coreValues: Array.isArray(coreValues) ? coreValues : undefined,
        gallery: Array.isArray(gallery) ? gallery : undefined,
        youtubeLink: youtubeLink?.trim() || undefined,
        officeLocations: officeLocations !== undefined ? officeLocations : undefined,
        socialMedia: socialMedia !== undefined ? socialMedia : undefined,
        corporateLink: corporateLink?.trim() || undefined,
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedCompany
    });
  } catch (error) {
    console.error('updateCompanyProfile error:', error);
    return res.status(500).json({ success: false, message: 'Update failed.' });
  }
};

// ─────────────────────────────────────────────────────────────────────
// UPDATE PASSWORD
// ─────────────────────────────────────────────────────────────────────
export const updateCompanyPassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: 'active' },
      select: { companyId: true }
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'No company found.' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const company = await prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { password: true }
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const isValid = await bcrypt.compare(currentPassword, company.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.company.update({
      where: { id: membership.companyId },
      data: { password: passwordHash }
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.'
    });

  } catch (error) {
    console.error('updateCompanyPassword error:', error);
    return res.status(500).json({ success: false, message: 'Password update failed.' });
  }
};

// ─────────────────────────────────────────────────────────────────────
// UPDATE LOGO
// ─────────────────────────────────────────────────────────────────────
export const updateCompanyLogo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: 'active' },
      select: { companyId: true }
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'No company found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Logo file required.' });
    }

    const logoUrl = bufferToBase64(req.file.buffer, req.file.mimetype);

    const updated = await prisma.company.update({
      where: { id: membership.companyId },
      data: { logoUrl }
    });

    return res.status(200).json({
      success: true,
      message: 'Logo updated successfully.',
      logoUrl: updated.logoUrl
    });

  } catch (error) {
    console.error('updateCompanyLogo error:', error);
    return res.status(500).json({ success: false, message: 'Logo update failed.' });
  }
};

// ─────────────────────────────────────────────────────────────────────
// MOBILE CHANGE: REQUEST OTP
// ─────────────────────────────────────────────────────────────────────
export const requestMobileChangeOtp = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { newMobileNumber } = req.body;

    if (!newMobileNumber || !/^\d{10}$/.test(newMobileNumber)) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile required.' });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: 'active' },
      select: { companyId: true, user: { select: { mobileNumber: true } } }
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'No company found.' });
    }

    if (membership.user.mobileNumber === newMobileNumber) {
      return res.status(400).json({ success: false, message: 'New mobile same as current.' });
    }

    // Check if new mobile already used by another User
    const existingUser = await prisma.user.findUnique({ where: { mobileNumber: newMobileNumber } });
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ success: false, message: 'Mobile already in use by another account.' });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // Store pending mobile temporarily in Company table
    await prisma.company.update({
      where: { id: membership.companyId },
      data: { pendingMobile: newMobileNumber }
    });

    await prisma.otp.create({
      data: {
        mobileNumber: newMobileNumber,
        otpHash,
        expiresAt,
        purpose: 'mobile_change',
        userId
      }
    });

    console.log(`🟢 MOBILE CHANGE OTP for ${newMobileNumber}: [ ${otp} ]`);

    return res.status(200).json({
      success: true,
      message: 'OTP sent to new mobile number.'
    });

  } catch (error) {
    console.error('requestMobileChangeOtp error:', error);
    return res.status(500).json({ success: false, message: 'OTP request failed.' });
  }
};

// ─────────────────────────────────────────────────────────────────────
// MOBILE CHANGE: VERIFY OTP & UPDATE
// ─────────────────────────────────────────────────────────────────────
export const verifyMobileChangeOtp = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP required.' });
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: 'active' },
      select: { companyId: true }
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'No company found.' });
    }

    const company = await prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { pendingMobile: true }
    });

    if (!company?.pendingMobile) {
      return res.status(400).json({ success: false, message: 'No pending mobile change request.' });
    }

    const latestOtp = await prisma.otp.findFirst({
      where: {
        mobileNumber: company.pendingMobile,
        purpose: 'mobile_change',
        userId
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestOtp || latestOtp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found.' });
    }

    const isValid = await bcrypt.compare(otp, latestOtp.otpHash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // Update User's mobileNumber
    await prisma.user.update({
      where: { id: userId },
      data: { mobileNumber: company.pendingMobile }
    });

    // Clear pending mobile
    await prisma.company.update({
      where: { id: membership.companyId },
      data: { pendingMobile: null }
    });

    // Delete used OTP
    await prisma.otp.delete({ where: { id: latestOtp.id } });

    return res.status(200).json({
      success: true,
      message: 'Mobile number updated successfully.',
      newMobileNumber: company.pendingMobile
    });

  } catch (error) {
    console.error('verifyMobileChangeOtp error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed.' });
  }
};

// ─────────────────────────────────────────────────────────────────────
// EMAIL CHANGE: REQUEST OTP
// ─────────────────────────────────────────────────────────────────────
export const requestEmailChangeOtp = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { newEmail } = req.body;

    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      return res.status(400).json({ success: false, message: 'Valid email required.' });
    }

    const normalizedEmail = newEmail.trim().toLowerCase();

    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: 'active' },
      select: { companyId: true }
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'No company found.' });
    }

    const company = await prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { email: true }
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    if (company.email === normalizedEmail) {
      return res.status(400).json({ success: false, message: 'New email same as current.' });
    }

    // Check if email already used by another company
    const existingCompany = await prisma.company.findFirst({
      where: { email: normalizedEmail, NOT: { id: membership.companyId } }
    });

    if (existingCompany) {
      return res.status(409).json({ success: false, message: 'Email already in use by another company.' });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Store OTP (we'll use a temporary "purpose" string with the new email)
    await prisma.otp.create({
      data: {
        mobileNumber: normalizedEmail, // Reusing mobileNumber field for email OTP
        otpHash,
        expiresAt,
        purpose: `email_change:${membership.companyId}`,
        userId
      }
    });

    // Send OTP via email
    try {
      await sendVerificationEmail(normalizedEmail, `Your email verification OTP is: ${otp}`);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
    }

    console.log(`🟢 EMAIL CHANGE OTP for ${normalizedEmail}: [ ${otp} ]`);

    return res.status(200).json({
      success: true,
      message: 'OTP sent to new email address.'
    });

  } catch (error) {
    console.error('requestEmailChangeOtp error:', error);
    return res.status(500).json({ success: false, message: 'OTP request failed.' });
  }
};

// ─────────────────────────────────────────────────────────────────────
// EMAIL CHANGE: VERIFY OTP & UPDATE
// ─────────────────────────────────────────────────────────────────────
export const verifyEmailChangeOtp = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { newEmail, otp } = req.body;

    if (!newEmail || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP required.' });
    }

    const normalizedEmail = newEmail.trim().toLowerCase();

    const membership = await prisma.teamMember.findFirst({
      where: { userId, status: 'active' },
      select: { companyId: true }
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'No company found.' });
    }

    const latestOtp = await prisma.otp.findFirst({
      where: {
        mobileNumber: normalizedEmail,
        purpose: `email_change:${membership.companyId}`,
        userId
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestOtp || latestOtp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found.' });
    }

    const isValid = await bcrypt.compare(otp, latestOtp.otpHash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // Update Company email
    await prisma.company.update({
      where: { id: membership.companyId },
      data: { email: normalizedEmail }
    });

    // Delete used OTP
    await prisma.otp.delete({ where: { id: latestOtp.id } });

    return res.status(200).json({
      success: true,
      message: 'Email updated successfully.',
      newEmail: normalizedEmail
    });

  } catch (error) {
    console.error('verifyEmailChangeOtp error:', error);
    return res.status(500).json({ success: false, message: 'Email update failed.' });
  }
};