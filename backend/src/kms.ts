
import { KMSClient, EncryptCommand, DecryptCommand, GenerateDataKeyCommand } from "@aws-sdk/client-kms";
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Client only if not in Mock Mode
const useMockKms = process.env.MOCK_KMS === 'true';
const kmsClient = useMockKms ? null : new KMSClient({ region: process.env.AWS_REGION });

// --- MOCK IMPLEMENTATIONS (For Local Development) ---
function mockGenerateDataKey() {
    const plaintext = crypto.randomBytes(32); // 256-bit key
    // In a real mock, we might "encrypt" this with a static master key. 
    // For simplicity, we just prefix it to show it's "wrapped".
    const ciphertextBlob = Buffer.concat([Buffer.from('mock-encrypted:'), plaintext]);
    return { plaintext, ciphertextBlob };
}

function mockDecrypt(ciphertext: Uint8Array) {
    // Check if it's our mock format
    const buffer = Buffer.from(ciphertext);
    const prefix = Buffer.from('mock-encrypted:');

    if (buffer.subarray(0, prefix.length).equals(prefix)) {
        return buffer.subarray(prefix.length);
    }
    // If we can't "decrypt" it, return null or throw. 
    // For dev stability, we'll return random bytes if it fails, or throw.
    throw new Error('Mock KMS: Unable to decrypt blob (Invalid format)');
}

// --- EXPORTED FUNCTIONS ---

export async function generateDataKey(kmsKeyId: string) {
    if (useMockKms) {
        console.log('⚠️  Using MOCK KMS for GenerateDataKey');
        return mockGenerateDataKey();
    }

    const cmd = new GenerateDataKeyCommand({
        KeyId: kmsKeyId,
        KeySpec: 'AES_256'
    });
    const res = await kmsClient!.send(cmd);
    return {
        plaintext: res.Plaintext,
        ciphertextBlob: res.CiphertextBlob
    };
}

export async function encryptWithKMS(plaintext: Uint8Array) {
    if (useMockKms) {
        console.log('⚠️  Using MOCK KMS for Encrypt');
        // Simple mock wrap
        return Buffer.concat([Buffer.from('mock-encrypted:'), plaintext]);
    }

    const keyId = process.env.KMS_KEY_ID!;
    const cmd = new EncryptCommand({
        KeyId: keyId,
        Plaintext: plaintext
    });
    const res = await kmsClient!.send(cmd);
    return res.CiphertextBlob;
}

export async function decryptWithKMS(ciphertext: Uint8Array) {
    if (useMockKms) {
        return mockDecrypt(ciphertext);
    }

    const cmd = new DecryptCommand({
        CiphertextBlob: ciphertext
    });
    const res = await kmsClient!.send(cmd);
    return res.Plaintext;
}
