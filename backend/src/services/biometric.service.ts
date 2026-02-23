import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';
import { cosineSimilarity } from '../utils/biometric';
import { AppError } from '../middleware';

const prisma = new PrismaClient();

const BIOMETRIC_THRESHOLD = 0.85; // 85% similarity threshold

export class BiometricService {

    /**
     * Enrolls a user's biometric data (Multi-Sample).
     * Accepts an array of embeddings (e.g., Center, Left, Right).
     */
    async enroll(userId: string, embeddings: number[][]) {
        // Validation
        if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
            throw new AppError(400, 'Invalid biometric samples format. Expected array of embeddings.');
        }

        const results = [];

        for (const embedding of embeddings) {
            if (embedding.length !== 128) {
                console.warn('Skipping invalid embedding sample');
                continue;
            }

            // Encrypt embedding
            const jsonEmbedding = JSON.stringify(embedding);
            const { iv, encryptedData } = encrypt(jsonEmbedding);

            // Store in DB
            const record = await prisma.biometricEmbedding.create({
                data: {
                    userId,
                    embedding: { iv, data: encryptedData }, // Storing as JSON object matching schema type
                    version: 'v1.0'
                }
            });
            results.push(record);
        }

        return results;
    }

    /**
     * Verifies a user's biometric identity.
     * Decrypts stored embedding and computes cosine similarity.
     * Returns the BEST match score from all stored samples.
     */
    async verify(userId: string, incomingEmbedding: number[]): Promise<{ verified: boolean; score: number }> {
        if (!incomingEmbedding || incomingEmbedding.length !== 128) {
            throw new AppError(400, 'Invalid biometric embedding format');
        }

        // Fetch user's registered embeddings
        const records = await prisma.biometricEmbedding.findMany({
            where: { userId }
        });

        if (!records.length) {
            // No enrollment found
            return {
                verified: false,
                score: 0
            };
        }

        let maxScore = 0;

        for (const record of records) {
            try {
                // Decrypt
                const storedEncrypted = record.embedding as any; // Cast to expected structure
                if (storedEncrypted.metaType === 'VOICE') continue; // Skip Voice samples
                if (!storedEncrypted.iv || !storedEncrypted.data) continue; // Skip malformed

                const { iv, data } = storedEncrypted;
                const decryptedJson = decrypt({ iv, encryptedData: data });
                const storedVector = JSON.parse(decryptedJson);

                // Compare
                const score = cosineSimilarity(incomingEmbedding, storedVector);
                if (score > maxScore) {
                    maxScore = score;
                }
            } catch (e) {
                console.error('Failed to process biometric record', e);
            }
        }

        return {
            verified: maxScore >= BIOMETRIC_THRESHOLD,
            score: maxScore
        };
    }
}
