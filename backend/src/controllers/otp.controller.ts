import { Request, Response, NextFunction } from 'express';
import { createOTPChallenge, verifyOTP } from '../services/otp.service';
import { AppError } from '../middleware';

export const generateOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.body; // Or get from req.user if authenticated
        if (!userId) throw new AppError(400, 'User ID required');

        const otp = await createOTPChallenge(userId);

        // specific formatting for response
        res.json({
            success: true,
            message: 'OTP generated',
            // In prod, don't send OTP in response, send via SMS/Email. 
            // For MVP/Demo, sending in response specifically for "BioShield" debug/demo flow.
            debug_otp: otp
        });
    } catch (err) {
        next(err);
    }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) throw new AppError(400, 'User ID and OTP required');

        const result = await verifyOTP(userId, otp);

        if (!result.success) {
            throw new AppError(401, result.message || 'Invalid OTP');
        }

        res.json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (err) {
        next(err);
    }
};
