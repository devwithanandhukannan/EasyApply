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
    if (!mobileNumber || !otp)
      return res.status(400).json({ success: false, message: 'Mobile and OTP required.' });

    const latestOtp = await prisma.otp.findFirst({
      where: { mobileNumber },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp || latestOtp.expiresAt < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired or not found.' });

    const isValid = await bcrypt.compare(otp, latestOtp.otpHash);
    if (!isValid)
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });

    const include = {
      jobSeekerProfile: true,
      teamMemberships: { include: { company: true } },
    };

    let user = await prisma.user.findUnique({ where: { mobileNumber }, include });

    if (!user) {
      user = await prisma.user.create({
        data: { mobileNumber, isVerified: true, globalRoles: ROLES.JOB_SEEKER },
        include,
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
        include,
      });
    }

    if (!latestOtp.userId)
      await prisma.otp.update({ where: { id: latestOtp.id }, data: { userId: user.id } });

    issueSessionCookies(res, { userId: user.id, globalRoles: user.globalRoles });
    return res.status(200).json({ success: true, message: 'Login successful.', user });
  } catch (error) {
    console.error('verifyOtp error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const checkMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId)
      return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobSeekerProfile: true,
        teamMemberships: { include: { company: true } },
      },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to authenticate.' });
  }
};

export const logoutUser = (_req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.status(200).json({ success: true, message: 'Logged out.' });
};