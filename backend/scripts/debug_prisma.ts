import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Prisma Keys:', Object.keys(prisma));

    // Check specific keys
    if ('otpChallenge' in prisma) console.log('Found: otpChallenge');
    // @ts-ignore
    if ('oTPChallenge' in prisma) console.log('Found: oTPChallenge');
    // @ts-ignore
    if ('OTPChallenge' in prisma) console.log('Found: OTPChallenge');

    // Also check User, BiometricEmbedding
    if ('biometricEmbedding' in prisma) console.log('Found: biometricEmbedding');
    if ('biometricAsset' in prisma) console.log('Found: biometricAsset');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
