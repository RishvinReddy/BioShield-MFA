import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware';
import { analyzeForensicSample } from '../biometrics';
import { logEvent } from '../audit';

export const analyzeAlert = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) throw new AppError(400, 'File is required');

        const analysis = analyzeForensicSample(req.file.buffer);

        // Log high-risk detections
        if (analysis.isDeepfake) {
            const userId = (req as any).user?.id;
            logEvent({
                userId,
                action: 'FORENSIC_ALERT',
                metadata: { type: 'DEEPFAKE_DETECTED', confidence: analysis.confidence }
            }).catch(e => console.error(e));
        }

        res.json({ success: true, data: analysis });
    } catch (err) {
        next(err);
    }
};
