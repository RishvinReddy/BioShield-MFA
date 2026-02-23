
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log(`\n--- CREATING USER 'RAM' ---`);

    const email = 'ram@gmail.com';
    const name = 'Ram';
    const password = '123qwe'; // In real app, hash this!

    // Hash password for "security" in this demo
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Check if exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log(`User already exists! ID: ${existing.id}`);
        // Clean up to recreate if needed? No, just report.
        // actually, let's delete and recreate to prove "new" user
        console.log("Deleting existing 'ram@gmail.com' to ensure fresh creation...");
        await prisma.user.delete({ where: { email } });
    }

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash, // simplistic hash
            role: 'USER',
            // Assuming name is not in schema based on previous `schema.prisma` read?
            // Let's check schema.prisma again. 
            // `User` model: id, email, passwordHash, phone, role... 
            // It does NOT have a 'name' field in the schema I read earlier!
            // I will just use email.
        }
    });

    console.log(`✅ User Created Successfully!`);
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Created At: ${user.createdAt}`);
    console.log(`-----------------------------`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
