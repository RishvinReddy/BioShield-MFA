import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function unlockAdmin() {
    try {
        const email = 'admin@bioshield.com';
        await prisma.user.update({
            where: { email },
            data: {
                accountLocked: false,
                failedAttempts: 0,
                lockUntil: null
            }
        });
        console.log(`✅ User ${email} unlocked successfully.`);
    } catch (e) {
        console.error('Error unlocking user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

unlockAdmin();
