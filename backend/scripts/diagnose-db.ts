
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const dbUrl = process.env.DATABASE_URL || 'UNDEFINED';
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    console.log(`\n--- DIAGNOSTICS START ---`);
    console.log(`Database URL: ${maskedUrl}`);

    try {
        // 1. Check User Table
        const userCount = await prisma.user.count();
        console.log(`Total Users in DB: ${userCount}`);

        // 2. Check Embedding Table
        const embeddingCount = await prisma.biometricEmbedding.count();
        console.log(`Total Embeddings in DB: ${embeddingCount}`);

        // 3. Create Test User
        const testId = `test-user-${Date.now()}`;
        console.log(`\nAttempting to create test user: ${testId}`);

        const user = await prisma.user.create({
            data: {
                id: testId,
                email: `${testId}@test.com`,
                passwordHash: 'test',
                role: 'TEST'
            }
        });
        console.log(`✅ Test User Created: ${user.id}`);


        // 4. Verify Read
        const savedUser = await prisma.user.findUnique({ where: { id: testId } });
        if (savedUser) {
            console.log(`✅ Verified Read: User ${savedUser.id} found.`);
        } else {
            console.error(`❌ Verified Read Failed: User ${testId} NOT found.`);
        }

        // 5. Clean up
        await prisma.user.delete({ where: { id: testId } }).catch(() => { });
        console.log(`Test user cleaned up.`);
    } catch (e) {
        console.error(`❌ DIAGNOSTIC ERROR: ${e.message}`);
        console.error(e);
    }

    console.log(`--- DIAGNOSTICS END ---\n`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
