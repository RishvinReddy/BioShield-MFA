
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config();
const prisma = new PrismaClient();

async function main() {
    console.log("--- Checking for RAM ---");

    // 1. Check by Email
    const ramByEmail = await prisma.user.findMany({
        where: { email: { contains: 'ram' } }
    });
    console.log(`Found ${ramByEmail.length} users with 'ram' in email:`);
    for (const u of ramByEmail) {
        const bios = await prisma.biometricEmbedding.count({ where: { userId: u.id } });
        console.log(`- ID: ${u.id} | Email: ${u.email} | Biometrics: ${bios}`);
    }

    // 2. Check by ID (since we used email as ID in frontend)
    const ramById = await prisma.user.findUnique({
        where: { id: 'ram@gmail.com' }
    });
    if (ramById) {
        // Avoid duplicate logging if it was found above
        if (!ramByEmail.find(u => u.id === ramById.id)) {
            const bios = await prisma.biometricEmbedding.count({ where: { userId: ramById.id } });
            console.log(`\nFound User with ID 'ram@gmail.com':`);
            console.log(`- ID: ${ramById.id} | Email: ${ramById.email} | Biometrics: ${bios}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
