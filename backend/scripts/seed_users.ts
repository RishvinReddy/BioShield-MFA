import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding Test Users...');

    const users = [
        { email: 'user@test.com', password: 'password123', role: 'USER' },
        { email: 'manager@test.com', password: 'password123', role: 'MANAGER' }, // Assuming MANAGER role exists or just USER
        { email: 'admin_test@test.com', password: 'password123', role: 'ADMIN' }
    ];

    for (const u of users) {
        const hash = await bcrypt.hash(u.password, 10);

        try {
            const user = await prisma.user.upsert({
                where: { email: u.email },
                update: {
                    passwordHash: hash,
                    role: u.role,
                    accountLocked: false,
                    failedAttempts: 0
                },
                create: {
                    email: u.email,
                    passwordHash: hash,
                    role: u.role,
                    failedAttempts: 0,
                    accountLocked: false
                }
            });
            console.log(`✅ Seeded: ${u.email} (${u.role})`);
        } catch (e) {
            console.error(`❌ Failed to seed ${u.email}:`, e);
        }
    }

    // List all users to confirm
    const allUsers = await prisma.user.findMany();
    console.log('\n📊 Current Users in DB:');
    allUsers.forEach(u => console.log(`- ${u.email} [${u.role}]`));
}

seed()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
