
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();
const prisma = new PrismaClient();

async function main() {
    console.log("--- SECURING RAM'S PASSWORD ---");

    // 1. Find Ram
    const ram = await prisma.user.findFirst({
        where: { email: 'ram@gmail.com' }
    });

    if (!ram) {
        console.error("❌ Ram not found!");
        return;
    }

    console.log(`Found Ram: ${ram.id}`);

    // 2. Hash password
    const plainPassword = '123qwe';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

    // 3. Update
    await prisma.user.update({
        where: { id: ram.id },
        data: { passwordHash }
    });

    console.log(`✅ Password for 'ram@gmail.com' updated to bcrypt hash.`);
    console.log(`New Hash: ${passwordHash.substring(0, 20)}...`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
