import type { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { prisma } from '../utils/prisma.ts';
import { encrypt, maskSecret } from '../utils/settingsEncryption.ts';
import { invalidateSettingsCache } from '../services/platformSettings.service.ts';

// Helper: upsert the singleton row
async function upsertSettings(data: Record<string, any>) {
  return prisma.platformSettings.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', ...data },
  });
}

// ─── GET ALL SETTINGS (masked) ────────────────────────────────────────────────

export const getSettings = async (_req: Request, res: Response) => {
  try {
    const s = await prisma.platformSettings.findUnique({ where: { id: 'singleton' } });
    return res.json({
      success: true,
      settings: {
        // Walk-in
        walkInQueueMaxGlobal: s?.walkInQueueMaxGlobal ?? 200,
        // Razorpay
        razorpayKeyId: s?.razorpayKeyId ?? null,
        razorpayKeySecret: maskSecret(s?.razorpayKeySecret),
        razorpayWebhookSecret: maskSecret(s?.razorpayWebhookSecret),
        razorpayMode: s?.razorpayMode ?? 'test',
        // SMTP
        smtpHost: s?.smtpHost ?? 'smtp.gmail.com',
        smtpPort: s?.smtpPort ?? 587,
        smtpUser: s?.smtpUser ?? null,
        smtpPass: maskSecret(s?.smtpPass),
        emailFrom: s?.emailFrom ?? null,
        emailFromName: s?.emailFromName ?? 'EasyApply',
        // Groq
        groqApiKey: maskSecret(s?.groqApiKey),
        groqModel: s?.groqModel ?? process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
        // LiveKit
        livekitApiUrl: s?.livekitApiUrl ?? null,
        livekitApiKey: s?.livekitApiKey ?? null,
        livekitApiSecret: maskSecret(s?.livekitApiSecret),
        // General
        platformName: s?.platformName ?? 'EasyApply',
        platformLogoUrl: s?.platformLogoUrl ?? null,
        supportEmail: s?.supportEmail ?? null,
        maintenanceMode: s?.maintenanceMode ?? false,
        allowNewCompanyReg: s?.allowNewCompanyReg ?? true,
        allowNewSeekerReg: s?.allowNewSeekerReg ?? true,
        allowSeekerAiResumeCreation: s?.allowSeekerAiResumeCreation ?? true,
      }
    });
  } catch { return res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── PAYMENT SETTINGS ─────────────────────────────────────────────────────────

export const updatePaymentSettings = async (req: Request, res: Response) => {
  try {
    const { razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret, razorpayMode } = req.body;
    const data: any = {};
    if (razorpayKeyId !== undefined) data.razorpayKeyId = razorpayKeyId;
    if (razorpayKeySecret && !razorpayKeySecret.includes('•')) data.razorpayKeySecret = encrypt(razorpayKeySecret);
    if (razorpayWebhookSecret && !razorpayWebhookSecret.includes('•')) data.razorpayWebhookSecret = encrypt(razorpayWebhookSecret);
    if (razorpayMode) data.razorpayMode = razorpayMode;
    await upsertSettings(data);
    invalidateSettingsCache();
    return res.json({ success: true, message: 'Payment settings updated' });
  } catch { return res.status(500).json({ success: false, message: 'Server error' }); }
};

export const testPaymentSettings = async (req: Request, res: Response) => {
  try {
    const { razorpayKeyId, razorpayKeySecret } = req.body;
    // Simple auth test — Razorpay /v1/orders needs auth
    const resp = await fetch('https://api.razorpay.com/v1/orders?count=1', {
      headers: { Authorization: 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64') }
    });
    if (resp.ok) return res.json({ success: true, message: 'Razorpay credentials are valid ✅' });
    return res.json({ success: false, message: `Razorpay responded with ${resp.status}: Invalid credentials` });
  } catch { return res.status(500).json({ success: false, message: 'Could not reach Razorpay API' }); }
};

// ─── EMAIL SETTINGS ───────────────────────────────────────────────────────────

export const updateEmailSettings = async (req: Request, res: Response) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, emailFrom, emailFromName } = req.body;
    const data: any = {};
    if (smtpHost !== undefined) data.smtpHost = smtpHost;
    if (smtpPort !== undefined) data.smtpPort = parseInt(smtpPort);
    if (smtpUser !== undefined) data.smtpUser = smtpUser;
    if (smtpPass && !smtpPass.includes('•')) data.smtpPass = encrypt(smtpPass);
    if (emailFrom !== undefined) data.emailFrom = emailFrom;
    if (emailFromName !== undefined) data.emailFromName = emailFromName;
    await upsertSettings(data);
    invalidateSettingsCache();
    return res.json({ success: true, message: 'Email settings updated' });
  } catch { return res.status(500).json({ success: false, message: 'Server error' }); }
};

export const testEmailSettings = async (req: Request, res: Response) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, emailFrom, sendTo } = req.body;
    if (!smtpHost || !smtpUser || !smtpPass || !sendTo)
      return res.status(400).json({ success: false, message: 'smtpHost, smtpUser, smtpPass, sendTo are required' });

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort ?? '587'),
      secure: parseInt(smtpPort ?? '587') === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"EasyApply Admin" <${emailFrom ?? smtpUser}>`,
      to: sendTo,
      subject: '✅ EasyApply SMTP Test',
      html: '<h2>SMTP test successful!</h2><p>Your email settings are correctly configured on EasyApply.</p>',
    });

    return res.json({ success: true, message: `Test email sent to ${sendTo} ✅` });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: `SMTP error: ${err.message}` });
  }
};

// ─── AI SETTINGS ──────────────────────────────────────────────────────────────

export const updateAiSettings = async (req: Request, res: Response) => {
  try {
    const { groqApiKey, groqModel, allowSeekerAiResumeCreation } = req.body;
    const data: any = {};
    if (groqApiKey && !groqApiKey.includes('•')) data.groqApiKey = encrypt(groqApiKey);
    if (groqModel) data.groqModel = groqModel;
    if (typeof allowSeekerAiResumeCreation === 'boolean') data.allowSeekerAiResumeCreation = allowSeekerAiResumeCreation;
    await upsertSettings(data);
    invalidateSettingsCache();
    return res.json({ success: true, message: 'AI settings updated' });
  } catch { return res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── VIDEO SETTINGS ───────────────────────────────────────────────────────────

export const updateVideoSettings = async (req: Request, res: Response) => {
  try {
    const { livekitApiUrl, livekitApiKey, livekitApiSecret } = req.body;
    const data: any = {};
    if (livekitApiUrl !== undefined) data.livekitApiUrl = livekitApiUrl;
    if (livekitApiKey !== undefined) data.livekitApiKey = livekitApiKey;
    if (livekitApiSecret && !livekitApiSecret.includes('•')) data.livekitApiSecret = encrypt(livekitApiSecret);
    await upsertSettings(data);
    invalidateSettingsCache();
    return res.json({ success: true, message: 'Video settings updated' });
  } catch { return res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── GENERAL SETTINGS ─────────────────────────────────────────────────────────

export const updateGeneralSettings = async (req: Request, res: Response) => {
  try {
    const { platformName, platformLogoUrl, supportEmail, maintenanceMode, allowNewCompanyReg, allowNewSeekerReg, allowSeekerAiResumeCreation } = req.body;
    const data: any = {};
    if (platformName !== undefined) data.platformName = platformName;
    if (platformLogoUrl !== undefined) data.platformLogoUrl = platformLogoUrl;
    if (supportEmail !== undefined) data.supportEmail = supportEmail;
    if (typeof maintenanceMode === 'boolean') data.maintenanceMode = maintenanceMode;
    if (typeof allowNewCompanyReg === 'boolean') data.allowNewCompanyReg = allowNewCompanyReg;
    if (typeof allowNewSeekerReg === 'boolean') data.allowNewSeekerReg = allowNewSeekerReg;
    if (typeof allowSeekerAiResumeCreation === 'boolean') data.allowSeekerAiResumeCreation = allowSeekerAiResumeCreation;
    await upsertSettings(data);
    invalidateSettingsCache();
    return res.json({ success: true, message: 'General settings updated' });
  } catch { return res.status(500).json({ success: false, message: 'Server error' }); }
};

// ─── QUEUE SETTINGS ───────────────────────────────────────────────────────────

export const updateQueueSettings = async (req: Request, res: Response) => {
  try {
    const { walkInQueueMaxGlobal } = req.body;
    if (typeof walkInQueueMaxGlobal !== 'number' || walkInQueueMaxGlobal < 1)
      return res.status(400).json({ success: false, message: 'walkInQueueMaxGlobal must be a positive number' });
    await upsertSettings({ walkInQueueMaxGlobal });
    invalidateSettingsCache();
    return res.json({ success: true, message: 'Queue settings updated' });
  } catch { return res.status(500).json({ success: false, message: 'Server error' }); }
};
