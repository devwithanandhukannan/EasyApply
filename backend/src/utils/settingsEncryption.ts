import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY ?? 'default-dev-key-change-in-production!!';
  return crypto.createHash('sha256').update(raw).digest();
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encryptedValue: string): string {
  const key = getKey();
  const [ivHex, dataHex] = encryptedValue.split(':');
  if (!ivHex || !dataHex) throw new Error('Invalid encrypted value format');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedBuf = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedBuf), decipher.final()]);
  return decrypted.toString('utf8');
}

export function safeDecrypt(encryptedValue: string | null | undefined): string | null {
  if (!encryptedValue) return null;
  try { return decrypt(encryptedValue); } catch { return null; }
}

export function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 4) return '••••';
  return `${'•'.repeat(Math.min(value.length - 4, 8))}${value.slice(-4)}`;
}
