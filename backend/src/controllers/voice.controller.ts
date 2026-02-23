import { Request, Response } from 'express';
import { enrollVoice, verifyVoice } from '../services/voice.service';

export const enrollVoiceController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, samples } = req.body;

        if (!userId || !samples || !Array.isArray(samples)) {
            res.status(400).json({ error: "Invalid input. 'userId' and 'samples' (array) are required." });
            return;
        }

        const result = await enrollVoice(userId, samples);
        res.json({ success: true, ...result });
    } catch (err: any) {
        console.error("Enrollment Error:", err);
        res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
    }
};

export const verifyVoiceController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, embedding } = req.body;

        if (!userId || !embedding) {
            res.status(400).json({ error: "Invalid input. 'userId' and 'embedding' are required." });
            return;
        }

        const result = await verifyVoice(userId, embedding);
        res.json({ success: true, ...result });
    } catch (err: any) {
        console.error("Verification Error:", err);
        res.status(400).json({ success: false, error: err.message || "Verification Failed" });
    }
};
