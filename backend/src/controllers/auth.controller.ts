import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { BiometricService } from '../services/biometric.service';
import { verifyVoice } from '../services/voice.service'; // Added
import { verifyOTP } from '../services/otp.service';
import { evaluateFusion, FusionInput } from '../services/fusion.service';
import { AppError } from '../middleware';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';

const authService = new AuthService();
const biometricService = new BiometricService();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

// Helper to generate Stage Token
const generateStageToken = (payload: any) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '5m' });
};

// Helper to verify Stage Token
const verifyStageToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET) as any;
    } catch (e) {
        throw new AppError(401, 'Invalid or expired session token');
    }
};

import { hash } from 'bcrypt';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) throw new AppError(400, 'Missing required fields');

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new AppError(409, 'User already exists');

        const passwordHash = await hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                // name removed as it's not in schema
                role: 'USER',
                // Default settings
                // mfaEnabled: true, // removed as it's not in schema
                accountLocked: false
            }
        });

        // Generate OTP for immediate verification
        const otpCodes = await import('../services/otp.service');
        const otp = await otpCodes.createOTPChallenge(user.id);
        console.log(`\n🔑 [DEV] REGISTRATION OTP for ${email}: ${otp}\n`);

        // Generate Stage Token (User Created -> Needs OTP)
        // We set passwordValid: true because they just set it.
        const stageToken = generateStageToken({
            userId: user.id,
            stage: 'PASSWORD_VERIFIED', // skipping password check since we just created it
            passwordValid: true
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Verify OTP.',
            userId: user.id,
            requiresOTP: true,
            stageToken
        });

    } catch (err) {
        next(err);
    }
};

// --- STAGE 1: PASSWORD ---
export const loginStep1 = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) throw new AppError(400, 'Missing credentials');

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new AppError(401, 'Invalid credentials');

        if (user.accountLocked && user.lockUntil && user.lockUntil > new Date()) {
            throw new AppError(403, 'Account is locked. Try again later.');
        }

        const valid = await authService.validateUser(email, password);
        if (!valid) {
            await prisma.user.update({
                where: { id: user.id },
                data: { failedAttempts: { increment: 1 } }
            });
            throw new AppError(401, 'Invalid credentials');
        }

        // Generate OTP
        const otpCodes = await import('../services/otp.service');
        const otp = await otpCodes.createOTPChallenge(user.id);
        console.log(`\n🔑 [DEV] GENERATED OTP for ${email}: ${otp}\n`);

        // Generate Stage Token (Password Verified)
        const stageToken = generateStageToken({
            userId: user.id,
            stage: 'PASSWORD_VERIFIED',
            passwordValid: true
        });

        res.json({
            success: true,
            requiresOTP: true,
            userId: user.id,
            stageToken
        });

    } catch (err) {
        next(err);
    }
};

// --- STAGE 2: OTP ---
export const loginStep2 = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, otp, stageToken } = req.body;
        if (!userId || !otp) throw new AppError(400, 'UserId and OTP required');

        // Verify previous stage
        let previousState: any = {};
        if (stageToken) {
            previousState = verifyStageToken(stageToken);
            if (previousState.userId !== userId) throw new AppError(401, 'Session mismatch');
        }

        const otpResult = await verifyOTP(userId, otp);
        const otpValid = otpResult.success;

        if (!otpValid) {
            throw new AppError(401, 'Invalid OTP');
        }

        // Generate next Stage Token
        const nextStageToken = generateStageToken({
            userId,
            stage: 'OTP_VERIFIED',
            passwordValid: previousState.passwordValid || false,
            otpValid: true
        });

        res.json({
            success: true,
            requiresBiometric: true,
            stageToken: nextStageToken
        });

    } catch (err) {
        next(err);
    }
};

// --- STAGE 3: BIOMETRIC + FUSION ---
export const loginStep3 = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, biometricEmbedding, voiceEmbedding, stageToken, deviceFingerprint } = req.body;

        // Recover state
        let state: any = { passwordValid: false, otpValid: false };
        if (stageToken) {
            const decoded = verifyStageToken(stageToken);
            if (decoded.userId !== userId) throw new AppError(401, 'Session mismatch');
            state = decoded;
        }

        // Verify Face Biometric
        let biometricScore = 0;
        if (biometricEmbedding) {
            try {
                const bioResult = await biometricService.verify(userId, biometricEmbedding);
                biometricScore = bioResult.score;
            } catch (e) {
                console.error("Face Biometric error", e);
                biometricScore = 0;
            }
        }

        // Verify Voice Biometric
        let voiceScore = 0;
        if (voiceEmbedding) {
            try {
                const voiceResult = await verifyVoice(userId, voiceEmbedding);
                voiceScore = voiceResult.score;
            } catch (e) {
                console.error("Voice Biometric error", e);
                voiceScore = 0;
            }
        }

        // Retrieve User for Fusion
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError(404, 'User not found');

        // Fusion Engine
        const fusionInput: FusionInput = {
            passwordValid: state.passwordValid,
            otpValid: state.otpValid,
            biometricScore, // Face
            voiceScore,     // Voice
            failedAttempts: user.failedAttempts
        };

        const decision = evaluateFusion(fusionInput);

        // Audit Log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                eventType: 'LOGIN_ATTEMPT',
                ipAddress: req.ip || 'unknown',
                riskScore: decision.score,
                decision: decision.decision
            }
        });

        // Enforcement
        if (decision.decision === "DENY") {
            await prisma.user.update({
                where: { id: user.id },
                data: { failedAttempts: { increment: 1 } }
            });
            throw new AppError(401, 'Access Denied (Risk too high)');
        }

        if (decision.decision === "STEP_UP") {
            res.json({
                success: false,
                stepUpRequired: true,
                retryBiometric: true // User Prompt
            });
            return;
        }

        if (decision.decision === "ALLOW") {
            // Reset failed attempts
            await prisma.user.update({
                where: { id: user.id },
                data: { failedAttempts: 0, accountLocked: false, lockUntil: null }
            });

            // Issue Real Tokens
            const sessionMetadata = { ip: req.ip, device: deviceFingerprint };
            const tokens = await authService.issueTokens(user, sessionMetadata, decision);

            res.json({
                success: true,
                ...tokens,
                score: decision.score,
                user: { id: user.id, email: user.email, role: user.role }
            });
        }

    } catch (err) {
        next(err);
    }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw new AppError(400, 'Refresh token required');
        const result = await authService.refreshToken(refreshToken);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

export const logout = async (req: Request, res: Response) => {
    res.json({ success: true, message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response) => {
    res.json({ user: (req as any).user });
};
