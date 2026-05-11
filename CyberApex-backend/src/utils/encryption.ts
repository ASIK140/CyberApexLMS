import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';

if (KEY.length !== 64 && KEY.length !== 32) {
    // Key should be 32 bytes (64 hex characters if hex, 32 if ascii)
    console.warn('WARNING: ENCRYPTION_KEY is not the optimal 32 bytes length');
}

/**
 * Encrypts a string using AES-256-GCM
 */
export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key using PBKDF2 to ensure it's 32 bytes
    const key = crypto.pbkdf2Sync(KEY, salt, 100000, 32, 'sha512');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
};

/**
 * Decrypts an AES-256-GCM encrypted string
 */
export const decrypt = (encdata: string): string => {
    const bData = Buffer.from(encdata, 'base64');

    const salt = bData.subarray(0, SALT_LENGTH);
    const iv = bData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = bData.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const text = bData.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = crypto.pbkdf2Sync(KEY, salt, 100000, 32, 'sha512');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = decipher.update(text) + decipher.final('utf8');
    return decrypted;
};
