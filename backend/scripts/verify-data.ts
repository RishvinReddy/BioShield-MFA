
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking database for recent users...");
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log(`Found ${users.length} users.`);
    users.forEach(u => {
        console.log(`- User: ${u.id} | Email: ${u.email} | Created: ${u.createdAt}`);
    });

    console.log("\nChecking for biometric embeddings...");
    const embeddings = await prisma.biometricEmbedding.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: true }
    });

    console.log(`Found ${embeddings.length} embeddings.`);
    embeddings.forEach(e => {
        console.log(`- Embedding ID: ${e.id} | User: ${e.user.email} | Created: ${e.createdAt}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
