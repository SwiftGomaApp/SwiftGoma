-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phoneRecoveryCode" TEXT,
ADD COLUMN     "phoneRecoveryCodeExpiresAt" TIMESTAMP(3);
