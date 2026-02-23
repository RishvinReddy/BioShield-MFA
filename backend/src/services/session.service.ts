import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware';

const prisma = new PrismaClient();

export class SessionService {

    /**
     * Creates a new active session for a user.
     * @param userId 
     * @param token Session token (e.g., JWT signature or specific session ID)
     */
    async createSession(userId: string, token: string) {
        return await prisma.session.create({
            data: {
                userId,
                token,
                active: true
            }
        });
    }

    /**
     * Validates if a session is active and updates its lastActive timestamp.
     * @param token 
     */
    async validateSession(token: string) {
        const session = await prisma.session.findUnique({
            where: { token }
        });

        if (!session || !session.active) {
            return false;
        }

        // Update heartbeat
        await prisma.session.update({
            where: { id: session.id },
            data: { lastActive: new Date() }
        });

        return true;
    }

    /**
     * Invalidates a session (Logout or Security Revocation).
     * @param token 
     */
    async invalidateSession(token: string) {
        // We use updateMany in case token isn't unique (though schema says unique) or to handle "invalidate all for user" logic if extended
        /*
        await prisma.session.update({
            where: { token },
            data: { active: false }
        });
        */
        // Safe approach: find first
        const session = await prisma.session.findUnique({ where: { token } });
        if (session) {
            await prisma.session.update({
                where: { id: session.id },
                data: { active: false }
            });
        }
    }

    /**
     * Terminate all sessions for a user (Security Lockdown)
     */
    async invalidateAllUserSessions(userId: string) {
        await prisma.session.updateMany({
            where: { userId, active: true },
            data: { active: false }
        });
    }
}
