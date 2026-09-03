-- AlterTable
ALTER TABLE "users" ADD COLUMN     "securityConfirmationCode" TEXT,
ADD COLUMN     "securityConfirmationCodeExpiresAt" TIMESTAMP(3);
