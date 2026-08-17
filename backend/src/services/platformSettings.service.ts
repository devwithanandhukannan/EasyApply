import { prisma } from '../utils/prisma.ts';
import { safeDecrypt } from '../utils/settingsEncryption.ts';

let cachedSettings: any = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60_000;

export async function getSettings() {
  if (cachedSettings && Date.now() < cacheExpiry) return cachedSettings;
  const s = await prisma.platformSettings.findUnique({ where: { id: 'singleton' } });
  cachedSettings = s;
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return s;
}

export function invalidateSettingsCache() {
  cachedSettings = null;
  cacheExpiry = 0;
}

export async function getSmtpConfig() {
  const s = await getSettings();
  const host = s?.smtpHost ?? process.env.SMTP_HOST ?? 'smtp.gmail.com';
  const port = s?.smtpPort ?? parseInt(process.env.SMTP_PORT ?? '587');
  const user = s?.smtpUser ?? process.env.SMTP_USER ?? '';
  const pass = (s?.smtpPass ? safeDecrypt(s.smtpPass) : null) ?? process.env.SMTP_PASS ?? '';
  const from = s?.emailFrom ?? process.env.EMAIL_FROM ?? user;
  const fromName = s?.emailFromName ?? 'EasyApply';
  if (!user || !pass) return null;
  return { host, port, user, pass, from, fromName };
}

export async function getRazorpayConfig() {
  const s = await getSettings();
  const keyId = s?.razorpayKeyId ?? process.env.RAZORPAY_KEY_ID ?? '';
  const keySecret = (s?.razorpayKeySecret ? safeDecrypt(s.razorpayKeySecret) : null) ?? process.env.RAZORPAY_KEY_SECRET ?? '';
  const webhookSecret = (s?.razorpayWebhookSecret ? safeDecrypt(s.razorpayWebhookSecret) : null) ?? process.env.RAZORPAY_WEBHOOK_SECRET ?? null;
  const mode = s?.razorpayMode ?? 'test';
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret, webhookSecret, mode };
}

export async function getGroqKey(): Promise<string> {
  const s = await getSettings();
  return (s?.groqApiKey ? safeDecrypt(s.groqApiKey) : null) ?? process.env.GROQ_API_KEY ?? '';
}

export async function getGroqModel(): Promise<string> {
  const s = await getSettings();
  return s?.groqModel ?? 'llama-3.3-70b-versatile';
}

export async function getLivekitConfig() {
  const s = await getSettings();
  const apiUrl = s?.livekitApiUrl ?? process.env.LIVEKIT_API_URL ?? '';
  const apiKey = s?.livekitApiKey ?? process.env.LIVEKIT_API_KEY ?? '';
  const apiSecret = (s?.livekitApiSecret ? safeDecrypt(s.livekitApiSecret) : null) ?? process.env.LIVEKIT_API_SECRET ?? '';
  if (!apiUrl || !apiKey || !apiSecret) return null;
  return { apiUrl, apiKey, apiSecret };
}

export async function getWalkInQueueMax(): Promise<number> {
  const s = await getSettings();
  return s?.walkInQueueMaxGlobal ?? 200;
}

export async function getPlatformGeneralSettings() {
  const s = await getSettings();
  return {
    platformName: s?.platformName ?? 'EasyApply',
    platformLogoUrl: s?.platformLogoUrl ?? null,
    supportEmail: s?.supportEmail ?? null,
    maintenanceMode: s?.maintenanceMode ?? false,
    allowNewCompanyReg: s?.allowNewCompanyReg ?? true,
    allowNewSeekerReg: s?.allowNewSeekerReg ?? true,
  };
}
