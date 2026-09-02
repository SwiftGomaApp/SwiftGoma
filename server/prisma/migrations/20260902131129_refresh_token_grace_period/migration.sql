-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "previousRefreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "previousRefreshTokenHash" TEXT;
