-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordResetCode" TEXT,
ADD COLUMN     "passwordResetCodeExpiresAt" TIMESTAMP(3);
