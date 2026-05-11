'use strict';
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // bytes
const TAG_LENGTH = 16; // bytes
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('SECURE_ENCRYPTION_ERROR: ENCRYPTION_KEY must be a 64-character hex string (32 bytes) defined in environment variables.');
}

/**
 * Encrypts a plaintext string into a format: iv:tag:ciphertext (all hex)
 */
function encrypt(text) {
    if (typeof text !== 'string') text = String(text);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string in format: iv:tag:ciphertext
 */
function decrypt(ciphertext) {
    if (!ciphertext || !ciphertext.includes(':')) return ciphertext;
    
    try {
        const [ivHex, tagHex, encryptedHex] = ciphertext.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
        decipher.setAuthTag(tag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (err) {
        console.error('Decryption failed:', err.message);
        return ciphertext; // Return as is if decryption fails
    }
}

module.exports = { encrypt, decrypt };
