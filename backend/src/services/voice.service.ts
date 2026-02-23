import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';
import { cosineSimilarity } from '../utils/biometric';

const prisma = new PrismaClient();

export async function enrollVoice(userId: string, samples: number[][]) {
    // Delete previous voice samples to keep storage clean (store only latest 3)
    // For now, we manually filter by fetching all and checking metadata in JSON
    // await prisma.biometricEmbedding.deleteMany({ where: { userId, type: "VOICE" } });
    const all = await prisma.biometricEmbedding.findMany({ where: { userId } });
    for (const record of all) {
        const embeddingData = record.embedding as any;
        if (embeddingData.metaType === 'VOICE') {
            await prisma.biometricEmbedding.delete({ where: { id: record.id } });
        }
    }

    for (const sample of samples) {
        // Encrypt the sensitive biometric vector
        // sample is number[], we need to stringify it before encryption
        // The encryption utility expects a string
        const encrypted = encrypt(JSON.stringify(sample));

        await prisma.biometricEmbedding.create({
            data: {
                userId,
                // type: "VOICE", // Removed as schema update failed
                embedding: { ...encrypted, metaType: 'VOICE' } as any, // Storing metadata in JSON
                version: "v1.0"
            }
        });
    }

    return { message: "Voice enrolled successfully", count: samples.length };
}

export async function verifyVoice(userId: string, incoming: number[]) {
    // 1. Fetch encrypted samples
    const allSamples = await prisma.biometricEmbedding.findMany({
        where: { userId }
    });

    // Filter for Voice samples manually
    const samples = allSamples.filter(s => (s.embedding as any).metaType === 'VOICE');

    if (!samples.length) {
        throw new Error("No voice enrollment found");
    }

    let maxScore = 0;

    // 2. Decrypt and Compare
    for (const sample of samples) {
        try {
            // sample.embedding is stored as stringified JSON in DB -> Prisma returns it as Json (object or string)
            // We need to parse it back to the EncryptedData shape { iv: string, encryptedData: string }

            // Handle Prisma Json type quirk: it might be an object already or a string
            let encryptedObj: any = sample.embedding;
            if (typeof encryptedObj === 'string') {
                encryptedObj = JSON.parse(encryptedObj);
            }

            // Decrypt: returns the stringified vector
            const decryptedString = decrypt(encryptedObj);

            // Parse back to number[]
            const storedVector = JSON.parse(decryptedString) as number[];

            // 3. Compute Similarity
            const score = cosineSimilarity(storedVector, incoming);

            if (score > maxScore) {
                maxScore = score;
            }
        } catch (error) {
            console.error(`Failed to process sample ${sample.id}`, error);
            // Continue to next sample
        }
    }

    return { score: maxScore, verified: maxScore > 0.8 }; // Threshold can be tuned
}
