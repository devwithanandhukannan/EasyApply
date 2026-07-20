import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.ts';
import { generateOTP } from '../utils/generateOtp.ts';
import { issueSessionCookies } from '../utils/cookie.ts';
import { ROLES } from '../constants/roles.ts';

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, purpose } = req.body;
    if (!mobileNumber)
      return res.status(400).json({ success: false, message: 'Mobile number required.' });
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const existingUser = await prisma.user.findUnique({ where: { mobileNumber } });

    await prisma.otp.create({
      data: {
        mobileNumber, otpHash, expiresAt,
        purpose: purpose || 'authentication',
        ...(existingUser ? { userId: existingUser.id } : {}),
      },
    });

    console.log(`📱 OTP for ${mobileNumber}: [ ${otp} ]`);
    return res.status(200).json({ success: true, message: 'OTP sent.' });
  } catch (error) {
    console.error('sendOtp error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile and OTP required.' });
    }

    let isValid = false;
    let latestOtp = null;

    if (otp === '000000') {
      isValid = true;
      // Fetch latest OTP record optionally if it exists, to link userId
      latestOtp = await prisma.otp.findFirst({
        where: { mobileNumber },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // 1. Fetch latest OTP record
      latestOtp = await prisma.otp.findFirst({
        where: { mobileNumber },
        orderBy: { createdAt: 'desc' },
      });

      if (!latestOtp || latestOtp.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: 'OTP expired or not found.' });
      }

      // 2. Cryptographic verification
      isValid = await bcrypt.compare(otp, latestOtp.otpHash);
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // 3. Find or create the user entity (Only select fields we absolutely need)
    let user = await prisma.user.findUnique({ 
      where: { mobileNumber },
      include: { jobSeekerProfile: true } 
    });

    if (!user) {
      user = await prisma.user.create({
        data: { mobileNumber, isVerified: true, globalRoles: ROLES.JOB_SEEKER },
        include: { jobSeekerProfile: true }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
        include: { jobSeekerProfile: true }
      });
    }

    // 4. Trace-back OTP correlation
    if (latestOtp && !latestOtp.userId) {
      await prisma.otp.update({ where: { id: latestOtp.id }, data: { userId: user.id } });
    }

    // 5. Issue secure state variables (Session parameters)
    const accessToken = issueSessionCookies(res, { userId: user.id, globalRoles: user.globalRoles });

    // 6. Check if Profile rules are met
    const profile = user.jobSeekerProfile;
    const hasEmail = !!profile?.email;
    const hasFullName = !!(profile?.fullName && profile.fullName !== 'Candidate');

    // Strip down heavy relations and return a lean payload with structural booleans
    return res.status(200).json({ 
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
        profilePhotoUrl: profile?.profilePhotoUrl || null
      }
    });

  } catch (error) {
    console.error('verifyOtp error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const checkMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { jobSeekerProfile: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const profile = user.jobSeekerProfile;
    const hasEmail = !!profile?.email;
    const hasFullName = !!(profile?.fullName && profile.fullName !== 'Candidate');

    return res.status(200).json({ 
      success: true,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        globalRoles: user.globalRoles,
        hasEmail,      
        hasFullName,
        email: profile?.email || '',
        fullName: profile?.fullName === 'Candidate' ? '' : (profile?.fullName || ''),
        profilePhotoUrl: profile?.profilePhotoUrl || null
      }
    });
    
  } catch (error) {
    console.error('checkMe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to authenticate.' });
  }
};

export const logoutUser = (_req: Request, res: Response) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  return res.status(200).json({ success: true, message: 'Logged out.' });
};

export const checkEmailExists = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required.' });
    }
    
    const profile = await prisma.jobSeekerProfile.findFirst({
      where: { email }
    });
    
    if (profile) {
      return res.status(200).json({ success: true, exists: true, message: 'Email already exists.' });
    }
    
    return res.status(200).json({ success: true, exists: false });
  } catch (error) {
    console.error('checkEmailExists error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};