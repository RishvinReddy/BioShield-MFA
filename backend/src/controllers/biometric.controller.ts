import { Request, Response, NextFunction } from 'express';
import { BiometricService } from '../services/biometric.service';
import { AppError } from '../middleware';
import prisma from '../prisma';

const biometricService = new BiometricService();

export const enrollBiometrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, embeddings } = req.body; // Expecting array of embeddings

        // Validation is done in service, but basic check here
        if (!userId || !embeddings || !Array.isArray(embeddings)) {
            throw new AppError(400, 'Missing userId or valid embeddings array');
        }

        // Create user if not exists (for demo flow)
        // Check if user exists
        let user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            console.log(`Creating temp user for demo: ${userId}`);
            // Create a dummy user to satisfy FK
            user = await prisma.user.create({
                data: {
                    id: userId,
                    email: `demo-${userId}@bioshield.io`,
                    passwordHash: 'DEMO_HASH', // Insecure but fine for this specific capture demo
                    role: 'DEMO_USER'
                }
            });
            console.log("Temp user created successfully:", user.id);
        }

        await biometricService.enroll(userId, embeddings);

        res.json({
            success: true,
            message: `Biometric enrollment successful (${embeddings.length} samples stored)`
        });
    } catch (err: any) {
        console.error('Enrollment Error:', err);
        res.status(500).json({
            success: false,
            message: `Enrollment Failed: ${err.message || 'Unknown Server Error'}`
        });
    }
};

export const verifyBiometrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, embedding } = req.body;
        if (!userId || !embedding) throw new AppError(400, 'Missing userId or embedding');

        const result = await biometricService.verify(userId, embedding);

        if (!result.verified) {
            // We can return 401 or just success:false with score. 
            // For security, 401 is better, but for "Fusion Engine" checking we might want the score.
            // Let's return success: true (request successful) but data says verified: false.
            res.json({
                success: true,
                data: {
                    verified: false,
                    score: result.score,
                    message: 'Biometric verification failed (Low Similarity)'
                }
            });
            return;
        }

        res.json({
            success: true,
            data: {
                verified: true,
                score: result.score,
                message: 'Biometric verification successful'
            }
        });
    } catch (err) {
        next(err);
    }
};
