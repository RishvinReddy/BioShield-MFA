import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/session.service';
import { AppError } from '../middleware';

const sessionService = new SessionService();

export const sendHeartbeat = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Expecting Authorization header: Bearer <token>
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new AppError(401, 'No session token provided');
        }

        const token = authHeader.split(' ')[1]; // Extract token
        const isValid = await sessionService.validateSession(token);

        if (!isValid) {
            // Signal frontend to logout
            return res.status(401).json({
                success: false,
                message: 'Session invalid or expired'
            });
        }

        res.json({ success: true, message: 'Heartbeat acknowledged' });
    } catch (err) {
        next(err);
    }
};

export const logoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            await sessionService.invalidateSession(token);
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
};
