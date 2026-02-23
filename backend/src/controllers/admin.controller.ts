import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../middleware';
import bcrypt from 'bcrypt';

// 1. Get All Users
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                accountLocked: true,
                failedAttempts: true,
                lockUntil: true,
                createdAt: true
            }
        });
        res.json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};

// 2. Unlock User
export const unlockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        await prisma.user.update({
            where: { id },
            data: {
                accountLocked: false,
                failedAttempts: 0,
                lockUntil: null
            }
        });

        // Log the admin action
        await prisma.auditLog.create({
            data: {
                userId: (req as any).user.id, // Admin ID
                eventType: 'ADMIN_UNLOCK_USER',
                decision: 'ALLOW',
                ipAddress: req.ip,
                riskScore: 0,
                // store target user ID in decision or separate field? 
                // schema doesn't have details field, so maybe append to eventType or just log it.
                // For now, we just log the event. Ideally AuditLog should have 'metadata'.
            }
        });

        res.json({ success: true, message: 'User unlocked successfully' });
    } catch (err) {
        next(err);
    }
};

// 3. Force Password Reset
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body; // or generate random?

        if (!newPassword || newPassword.length < 8) {
            throw new AppError(400, 'Password must be at least 8 characters');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id },
            data: {
                passwordHash: hashedPassword,
                accountLocked: false,
                failedAttempts: 0,
                lockUntil: null
            }
        });

        await prisma.auditLog.create({
            data: {
                userId: (req as any).user.id,
                eventType: 'ADMIN_RESET_PASSWORD',
                decision: 'ALLOW',
                ipAddress: req.ip,
                riskScore: 0
            }
        });

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        next(err);
    }
};

// 4. View Audit Logs
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, decision, limit = '50' } = req.query;

        const where: any = {};
        if (userId) where.userId = String(userId);
        if (decision) where.decision = String(decision);

        const logs = await prisma.auditLog.findMany({
            where,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true } } } // Include user email for context
        });

        res.json({ success: true, data: logs });
    } catch (err) {
        next(err);
    }
};

// 5. Suspicious Activity Report
export const getSuspiciousActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Define "Suspicious" as High Risk (low score) or Denied/StepUp decisions
        // Fusion Score: 0 is bad, 1 is good. 
        // So RiskScore < 0.65 (StepUp Threshold) is "Risky".

        const logs = await prisma.auditLog.findMany({
            where: {
                OR: [
                    { riskScore: { lt: 0.65 } },
                    { decision: { in: ['DENY', 'STEP_UP'] } }
                ]
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true } } }
        });

        res.json({ success: true, data: logs });
    } catch (err) {
        next(err);
    }
};
// 6. Create User (Admin Provisioning)
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            throw new AppError(400, 'Email and password are required');
        }

        // Check availability
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new AppError(409, 'User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role: role || 'USER', // Default to USER
                accountLocked: false,
                failedAttempts: 0
            }
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                userId: (req as any).user.id,
                eventType: 'ADMIN_CREATE_USER',
                decision: 'ALLOW',
                ipAddress: req.ip,
                riskScore: 0
            }
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { id: user.id, email: user.email, role: user.role }
        });
    } catch (err) {
        next(err);
    }
};
