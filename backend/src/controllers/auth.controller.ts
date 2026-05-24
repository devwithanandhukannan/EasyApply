// src/controllers/auth.controller.ts
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.ts';
import { generateOTP } from '../utils/generateOtp.ts';
import { issueSessionCookies } from '../utils/cookie.ts';
import { UserRole } from '@prisma/client';

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, purpose } = req.body; 
    if (!mobileNumber) {
      return res.status(400).json({ success: false, message: 'Mobile number required' });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const existingUser = await prisma.user.findUnique({ where: { mobileNumber } });

    await prisma.otp.create({
      data: {
        mobileNumber,
        otpHash,
        expiresAt,
        purpose: purpose || 'authentication',
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

    const user = await prisma.user.upsert({
      where: { mobileNumber },
      update: { isVerified: true }, 
      create: { mobileNumber, isVerified: true, role: UserRole.job_seeker }, 
      include: {
        jobSeekerProfile: true,
        teamMemberships: { include: { company: true } }
      }
    });

    if (!latestOtp.userId) {
      await prisma.otp.update({ where: { id: latestOtp.id }, data: { userId: user.id } });
    }

    // Bug Fix: Use clean shared cookie wrapper to set standard universal cookies
    issueSessionCookies(res, { userId: user.id, role: user.role as UserRole });

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

export const checkMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized session context' });
    }
    
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        jobSeekerProfile: true,
        teamMemberships: { include: { company: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User matching token context not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error in checkMe:', error);
    return res.status(500).json({ success: false, message: 'Failed to authenticate user session' });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};