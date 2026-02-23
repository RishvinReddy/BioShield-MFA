-- AlterTable
ALTER TABLE "AuthSession" ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "refresh_token_hash" TEXT;
