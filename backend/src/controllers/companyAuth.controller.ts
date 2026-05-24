import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.ts';
import { generateOTP } from '../utils/generateOtp.ts';
import { issueSessionCookies } from '../utils/cookie.ts';
import { UserRole } from '@prisma/client';
import { sendVerificationEmail } from '../utils/email.ts'; // 👈 Imported the new SMTP util

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret';

// Helper function that converts standard binary memory buffers into browser-renderable Base64 strings
const bufferToBase64 = (buffer: Buffer, mimeType: string): string => {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

/**
 * Handles generating the token string and triggering the Nodemailer verification link runner
 */
const generateAndSendVerificationEmail = async (companyId: string, email: string) => {
  // Generate a verification token containing the companyId expiring in 1 day (24h)
  const verificationToken = jwt.sign({ companyId }, JWT_SECRET, { expiresIn: '24h' });
  
  // Fire off actual SMTP delivery via utility configuration helper
  await sendVerificationEmail(email, verificationToken);
};

export const resendCompanyVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email parameter is required.' });
    }

    const company = await prisma.company.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, isEmailVerified: true }
    });

    if (!company) {
      // Security Best Practice: Don't explicitly reveal that an email doesn't exist to prevent enumeration
      return res.status(200).json({ success: true, message: 'If the account exists, a new verification link has been sent.' });
    }

    if (company.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'This workspace email has already been verified.' });
    }

    // Trigger email generation asynchronously
    await generateAndSendVerificationEmail(company.id, company.email);

    return res.status(200).json({
      success: true,
      message: 'A fresh activation link has been dispatched to your corporate inbox.'
    });

  } catch (error) {
    console.error('Error inside resendCompanyVerificationEmail:', error);
    return res.status(500).json({ success: false, message: 'Failed to process transactional email dispatch.' });
  }
};

export const sendCompanyOtp = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, email, companyName } = req.body;
    if (!mobileNumber || !email || !companyName) {
      return res.status(400).json({ success: false, message: 'Missing required validation inputs.' });
    }

    const existingCompany = await prisma.company.findUnique({
      where: { name: companyName.trim() }
    });
    if (existingCompany) {
      return res.status(400).json({ success: false, message: 'Company name is already registered' });
    }

    const existingEmail = await prisma.company.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Official email address is already in use' });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otp.create({
      data: { mobileNumber, otpHash, expiresAt, purpose: 'company_registration' },
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

    const preRegistrationToken = jwt.sign({ mobileNumber }, JWT_SECRET, { expiresIn: '15m' });
    return res.status(200).json({ success: true, message: 'Mobile verified', preRegistrationToken });
  } catch (error) {
    console.error('Error in verifyCompanyOtp:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const registerCompany = async (req: Request, res: Response) => {
  try {
    // 1. Structural Payload Validation
    if (!req.body.companyData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing structural registration parameters.' 
      });
    }

    const parsedData = JSON.parse(req.body.companyData);
    const { 
      companyName, 
      industry, 
      companySize, 
      email, 
      password, 
      gstNumber, 
      mobileNumber 
    } = parsedData;

    const activeMobileNumber = mobileNumber || req.user?.mobileNumber;

    if (!email || !password || !activeMobileNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required credentials or mobile verification context.' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Business Constraint Verification
    const existingCompany = await prisma.company.findUnique({ 
      where: { email: normalizedEmail } 
    });
    if (existingCompany) {
      return res.status(409).json({ 
        success: false, 
        message: 'A corporate workspace with this email address already exists.' 
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { mobileNumber: activeMobileNumber }
    });
    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mobile verification session context not found.' 
      });
    }

    const existingMembership = await prisma.teamMember.findUnique({
      where: { userId: existingUser.id }
    });
    if (existingMembership) {
      return res.status(400).json({ 
        success: false, 
        message: 'This authenticated profile is already linked to an active corporate workspace.' 
      });
    }

    // 3. Asset Processing & Cryptography
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    let logoUrl = null;
    if (req.file) {
      logoUrl = bufferToBase64(req.file.buffer, req.file.mimetype);
    }

    // 4. Atomic Database Execution Transaction
    const operationalWorkspace = await prisma.$transaction(async (tx) => {
      
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'company_admin',
          isVerified: true 
        }
      });

      return await tx.company.create({
        data: {
          name: companyName,
          industry: industry,
          size: companySize,
          email: normalizedEmail,
          passwordHash: passwordHash,
          mobileNumber: activeMobileNumber,
          logoUrl,
          registrationNumber: gstNumber,
          isVerified: false,       
          isEmailVerified: false,  
          verificationBadge: 'pending',
          teamMembers: {
            create: {
              role: 'admin',
              status: 'active',
              userId: existingUser.id 
            }
          }
        }
      });
    });

    // 5. Fire off transactional email link asynchronously using SMTP config
    try {
      await generateAndSendVerificationEmail(operationalWorkspace.id, operationalWorkspace.email);
    } catch (emailError) {
      console.error('SMTP Link Dispatch Failure during registration:', emailError);
      // We purposefully do not crash the request lifecycle; user can request a resend from login page
    }

    return res.status(201).json({
      success: true,
      message: 'Corporate workspace successfully provisioned. Please verify your email inbox to unlock your recruitment dashboard.'
    });

  } catch (error) {
    console.error('Critical Error inside registerCompany handler:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal corporate profile initialization failure.' 
    });
  }
};

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

    const company = await prisma.company.findUnique({
      where: { id: decoded.companyId },
      select: { isEmailVerified: true },
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company account not found' });
    }

    if (!company.isEmailVerified) {
      await prisma.company.update({
        where: { id: decoded.companyId },
        data: { isEmailVerified: true },
      });
    }

    const adminMembership = await prisma.teamMember.findFirst({
      where: { companyId: decoded.companyId, role: 'admin' },
      select: { userId: true }
    });

    if (!adminMembership) {
      return res.status(404).json({ success: false, message: 'Company administrator record missing' });
    }

    issueSessionCookies(res, { userId: adminMembership.userId, role: UserRole.company_admin });

    return res.status(200).json({ success: true, message: 'Email verified and logged in successfully.' });
  } catch (error) {
    console.error('Error in verifyCompanyEmail:', error);
    return res.status(500).json({ success: false, message: 'Internal server validation failure' });
  }
};

export const checkCompanySession = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized session context' });
    }

    const userWithCompany = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teamMemberships: {
          where: { status: 'active' },
          include: { company: true }
        }
      }
    });

    if (!userWithCompany) {
      return res.status(404).json({ success: false, message: 'User session profile not found' });
    }

    if (!userWithCompany.teamMemberships || userWithCompany.teamMemberships.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied: No linked company found' });
    }

    const primaryMembership = userWithCompany.teamMemberships[0];
    return res.status(200).json({
      success: true,
      isAuthenticated: true,
      user: {
        id: userWithCompany.id,
        mobileNumber: userWithCompany.mobileNumber,
        role: userWithCompany.role,
        memberRole: primaryMembership.role
      },
      company: primaryMembership.company
    });
  } catch (error) {
    console.error('Error in checkCompanySession:', error);
    return res.status(500).json({ success: false, message: 'Internal session validation failure' });
  }
};

export const companyLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password credentials are required.' });
    }

    const company = await prisma.company.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        teamMembers: {
          where: { role: 'admin' },
          select: { userId: true }
        }
      }
    });

    if (!company) {
      return res.status(401).json({ success: false, message: 'Invalid credentials provided.' });
    }

    const savedHash = company.passwordHash;

    if (!savedHash) {
      console.error(`❌ Security Error: Password hash missing for registered company email: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials provided.' });
    }

    const isPasswordValid = await bcrypt.compare(password, savedHash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials provided.' });
    }

    // If company email status check fails, trigger fresh token dispatch automatically
    if (!company.isEmailVerified) {
      try {
        await generateAndSendVerificationEmail(company.id, company.email);
      } catch (emailError) {
        console.error('Fallback login verification email dispatch failed:', emailError);
      }

      return res.status(403).json({
        success: false,
        emailVerified: false,
        message: 'Corporate email validation pending. A fresh verification link has been resent to your inbox.'
      });
    }

    const adminUser = company.teamMembers[0];
    if (!adminUser) {
      return res.status(422).json({ success: false, message: 'Workspace administrative context missing.' });
    }

    issueSessionCookies(res, {
      userId: adminUser.userId,
      role: 'company_admin'
    });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      user: {
        id: adminUser.userId,
        role: 'company_admin',
      },
      company: {
        id: company.id,
        name: company.name,
        email: company.email
      }
    });

  } catch (error) {
    console.error('Error inside companyLogin routine execution:', error);
    return res.status(500).json({ success: false, message: 'An processing exception occurred during login.' });
  }
};