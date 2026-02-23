import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-cbc';
// Ensure key is 32 bytes (256 bits). In prod, use KMS.
// Fallback for dev/demo if env var missing (NOT SECURE FOR PROD)
const KEY_STRING = process.env.BIOMETRIC_ENCRYPTION_KEY;

if (!KEY_STRING) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: BIOMETRIC_ENCRYPTION_KEY missing in production environment');
    }
    console.warn('WARNING: Using insecure default key for development. Set BIOMETRIC_ENCRYPTION_KEY in .env');
}

const KEY = KEY_STRING
    ? crypto.createHash('sha256').update(KEY_STRING).digest() // Always hash provided key to get 32 bytes
    : crypto.createHash('sha256').update('bioshield-demo-key').digest();

const IV_LENGTH = 16;

export interface EncryptedData {
    iv: string;
    encryptedData: string;
}

export function encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex')
    };
}

export function decrypt(text: EncryptedData): string {
    const iv = Buffer.from(text.iv, 'hex');
    const encryptedText = Buffer.from(text.encryptedData, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
