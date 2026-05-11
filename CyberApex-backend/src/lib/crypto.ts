import argon2 from 'argon2';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

export async function hashPassword(password: string): Promise<string> {
  const peppered = password + (process.env.ARGON2_PEPPER ?? 'cyberapex-dev-pepper-2026');
  return argon2.hash(peppered, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  const peppered = password + (process.env.ARGON2_PEPPER ?? 'cyberapex-dev-pepper-2026');
  return argon2.verify(hash, peppered);
}

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(encryptedText: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function generateVerificationHash(enrollmentId: string, certNumber: string): string {
  const secret = process.env.CERT_VERIFICATION_SECRET ?? 'default-secret';
  return sha256(`${enrollmentId}${certNumber}${Date.now()}${secret}`);
}
