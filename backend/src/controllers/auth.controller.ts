import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.ts';
import { generateOTP } from '../utils/generateOtp.ts';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.ts';

// Extend Request type locally or ensure your auth middleware handles this type structure
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

// ─── STEP 1: Send OTP ────────────────────────────────────────────────────
export const sendOtp = async (req: Request, res: Response) => {
  console.log('Received sendOtp request with body:', req.body);
  try {
    const { mobileNumber, purpose } = req.body; 
    if (!mobileNumber) {
      return res.status(400).json({ success: false, message: 'Mobile number required' });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    const existingUser = await prisma.user.findUnique({ where: { mobileNumber } });

    await prisma.otp.create({
      data: {
        mobileNumber,
        otpHash,
        expiresAt,
        purpose: purpose || 'authentication', // Aligns safely with required schema string
        ...(existingUser ? { userId: existingUser.id } : {}),
      },
    });

    console.log('\n========================================');
    console.log(`📱 OTP for ${mobileNumber}: [ ${otp} ]`);
    console.log('========================================\n');

    return res.status(200).json({ success: true, message: 'OTP generated successfully' });
  } catch (error) {
    console.error('Error in sendOtp:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── STEP 2: Verify OTP & Issue Token Session Cookies ───────────────────
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const latestOtp = await prisma.otp.findFirst({
      where: { mobileNumber },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp || latestOtp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired' });
    }

    const isOtpValid = await bcrypt.compare(otp, latestOtp.otpHash);
    if (!isOtpValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Upsert user keeping historical context intact. Default new signups to 'job_seeker'
    // FIX: Updated include key from 'teamMembership' to 'teamMemberships' to match schema
    const user = await prisma.user.upsert({
      where: { mobileNumber },
      update: { isVerified: true }, 
      create: { mobileNumber, isVerified: true, role: 'job_seeker' }, 
      include: {
        jobSeekerProfile: true,
        teamMemberships: {
          include: { company: true }
        }
      }
    });

    if (!latestOtp.userId) {
      await prisma.otp.update({ where: { id: latestOtp.id }, data: { userId: user.id } });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Set Access Token inside an HttpOnly Cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Set Refresh Token inside an HttpOnly Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      user, 
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── STEP 3: Check Current Authenticated Session ────────────────────────
export const checkMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized session context' });
    }
    
    // FIX: Updated include key from 'teamMembership' to 'teamMemberships' to match schema
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        jobSeekerProfile: true,
        teamMemberships: {
          include: { company: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User matching this token data not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error in checkMe:', error);
    return res.status(500).json({ success: false, message: 'Failed to authenticate current user session' });
  }
};

// ─── STEP 4: Clear Session Cookies ──────────────────────────────────────
export const logoutUser = async (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};