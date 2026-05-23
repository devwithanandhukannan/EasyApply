import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { prisma } from '../utils/prisma.ts';
import { generateOTP } from '../utils/generateOtp.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Helper: Convert buffer stream into a clean client-safe string
const bufferToBase64 = (buffer: Buffer, mimeType: string): string => {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

// ─── STEP 1: Send WhatsApp OTP & Check Restrictions ──────────────────────
export const sendCompanyOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, email, companyName } = req.body;

    if (!mobileNumber || !email || !companyName) {
      return res.status(400).json({ success: false, message: 'Missing required validation inputs.' });
    }

    // Proactively verify uniqueness restrictions before proceeding down steps
    const existingCompany = await prisma.company.findUnique({ where: { name: companyName.trim() } });
    if (existingCompany) {
      return res.status(400).json({ success: false, message: 'Company name is already registered' });
    }

    // FIX: Changed officialEmail -> email to match active Prisma schema
    const existingEmail = await prisma.company.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Official email address is already in use' });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    await prisma.otp.create({
      data: {
        mobileNumber,
        otpHash,
        expiresAt,
        purpose: 'company_registration',
      },
    });

    console.log('\n==================================================');
    console.log(`🟢 WHATSAPP CORPORATE OTP FOR ${mobileNumber}: [ ${otp} ]`);
    console.log('==================================================\n');

    return res.status(200).json({ success: true, message: 'OTP sent successfully via WhatsApp' });
  } catch (error) {
    console.error('Error in sendCompanyOtp:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── STEP 2: Verify WhatsApp OTP & Issue Flow Token ─────────────────────
export const verifyCompanyOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile number and OTP are required' });
    }

    const latestOtp = await prisma.otp.findFirst({
      where: { mobileNumber, purpose: 'company_registration' },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp || latestOtp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found' });
    }

    const isOtpValid = await bcrypt.compare(otp, latestOtp.otpHash);
    if (!isOtpValid) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    // Generate a secure token valid for 15 minutes to secure step 3 (additional details upload)
    const preRegistrationToken = jwt.sign(
      { mobileNumber },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      success: true,
      message: 'Mobile number verified successfully',
      preRegistrationToken,
    });
  } catch (error) {
    console.error('Error in verifyCompanyOtp:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── STEP 3: Complete Account Setup & Email Dispatch ─────────────────────
export const registerCompany = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Pre-registration token missing' });
    }

    const token = authHeader.split(' ')[1];
    let decoded: { mobileNumber: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { mobileNumber: string };
    } catch {
      return res.status(403).json({ success: false, message: 'Verification window expired. Restart step 1' });
    }

    if (!req.body.companyData) {
      return res.status(400).json({ success: false, message: 'Missing structural onboarding fields' });
    }

    const companyData = JSON.parse(req.body.companyData);
    const { companyName, industry, companySize, email, gstNumber } = companyData;

    let logoBase64: string | null = null;
    if (req.file) {
      logoBase64 = bufferToBase64(req.file.buffer, req.file.mimetype);
    }

    // Atomically execute across tables
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or link the root User row
      const user = await tx.user.upsert({
        where: { mobileNumber: decoded.mobileNumber },
        update: { role: 'company_admin', isVerified: true },
        create: { mobileNumber: decoded.mobileNumber, role: 'company_admin', isVerified: true },
      });

      // 2. Provision Company row profile
      // FIX: re-mapped officialEmail -> email, gstNumber -> registrationNumber, and attached mobileNumber
      const company = await tx.company.create({
        data: {
          name: companyName.trim(),
          industry,
          size: companySize,
          email: email.trim().toLowerCase(),
          mobileNumber: decoded.mobileNumber,
          registrationNumber: gstNumber?.trim() || null,
          logoUrl: logoBase64,
          verificationBadge: gstNumber ? 'pending' : 'none',
        },
      });

      // 3. Link Admin Membership
      await tx.teamMember.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: 'admin',
          status: 'active'
        },
      });

      return { company };
    });

    // 4. Generate long-lived asynchronous SMTP Email Verification Link
    const emailVerificationToken = jwt.sign(
      { companyId: result.company.id },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const activationLink = `${process.env.FRONTEND_URL_FOREMAIL}/verify-email?token=${emailVerificationToken}`;

    // Setup SMTP Transporter via Nodemailer
    const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
});

    await transporter.sendMail({
  from: `"Interviewer Platform" <${process.env.SMTP_USER}>`,
  to: email.trim(),
  subject: 'Verify your corporate email address',
  html: `
    <div style="font-family: sans-serif; padding: 24px; max-width: 600px; background-color: #f9f9f9;">
      <h2>Activate your Corporate Dashboard</h2>
      <p>Thank you for choosing Interviewer. Click the secure link below to verify your domain authenticity:</p>
      <a href="${activationLink}" style="display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; margin-top: 16px;">Verify Email Address</a>
      <p style="margin-top: 24px; color: #666; font-size: 12px;">This confirmation link expires in 24 hours.</p>
    </div>
  `,
});

    return res.status(201).json({
      success: true,
      message: 'Company registration processed successfully. Please review your email inbox.',
    });
  } catch (error) {
    console.error('Error during company registration:', error);
    return res.status(500).json({ success: false, message: 'Failed to process corporate registration' });
  }
};

// ─── STEP 4: Email Activation Verification Link Handler ──────────────────
export const verifyCompanyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Activation token parameter missing' });
    }

    let decoded: { companyId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { companyId: string };
    } catch {
      return res.status(403).json({ success: false, message: 'Activation token altered or expired' });
    }

    // Mark company as verified in the DB
    await prisma.company.update({
      where: { id: decoded.companyId },
      data: { isEmailVerified: true },
    });

    // Return JSON data payload instead of a raw HTML string block
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    console.error('Error in verifyCompanyEmail:', error);
    return res.status(500).json({ success: false, message: 'Internal server validation failure' });
  }
};