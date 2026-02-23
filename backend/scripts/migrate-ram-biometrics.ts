
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config();
const prisma = new PrismaClient();

async function main() {
    console.log("--- MIGRATING RAM BIOMETRICS ---");

    // 1. Find the REAL Ram (created via script/frontend with UUID)
    const realRam = await prisma.user.findFirst({
        where: {
            email: 'ram@gmail.com',
            id: { not: 'ram@gmail.com' }
        }
    });

    if (!realRam) {
        console.error("❌ REAL Ram (UUID) not found! Cannot migrate.");
        return;
    }
    console.log(`✅ Found Real Ram: ${realRam.id} (${realRam.email})`);

    // 2. Find the TEMP Ram
    const tempRam = await prisma.user.findUnique({
        where: { id: 'ram@gmail.com' }
    });

    if (!tempRam) {
        console.log("ℹ️ Temp Ram not found. Already migrated.");
        return;
    }
    console.log(`✅ Found Temp Ram: ${tempRam.id}`);

    // 3. Move Biometrics
    console.log("Migrating biometric records...");
    const updateResult = await prisma.biometricEmbedding.updateMany({
        where: { userId: tempRam.id },
        data: { userId: realRam.id }
    });
    console.log(`✅ Moved ${updateResult.count} records to Real Ram.`);

    // 4. Delete Temp Ram and dependencies
    console.log("Cleaning up Temp Ram dependencies...");

    // Safe delete helpers
    const safeDelete = async (model, name) => {
        try {
            if (model) await model.deleteMany({ where: { userId: tempRam.id } });
        } catch (e) {
            console.log(`⚠️ Failed to delete ${name}: ${e.message}`);
        }
    };

    // Try all possible capitalizations for OTP
    await safeDelete(prisma.oTPChallenge, 'oTPChallenge');
    await safeDelete(prisma.otpChallenge, 'otpChallenge');
    await safeDelete(prisma.OTPChallenge, 'OTPChallenge');

    await safeDelete(prisma.device, 'Device');
    await safeDelete(prisma.authSession, 'AuthSession');
    await safeDelete(prisma.session, 'Session');
    await safeDelete(prisma.auditLog, 'AuditLog');

    try {
        await prisma.user.delete({ where: { id: tempRam.id } });
        console.log("✅ Deleted Temp Ram user.");
    } catch (e) {
        console.log("⚠️ Could not delete temp user (references might still exist):", e.message);
    }

    console.log("--- MIGRATION COMPLETE ---");
}

main().catch(console.error).finally(() => prisma.$disconnect());
