-- CreateEnum
CREATE TYPE "ShopSuspendedBy" AS ENUM ('SELLER', 'ADMIN');

-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedBy" "ShopSuspendedBy",
ADD COLUMN     "suspensionReason" TEXT;
