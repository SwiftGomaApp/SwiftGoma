/*
  Warnings:

  - You are about to drop the column `deliveryFeePerKm` on the `shops` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryFreeKm` on the `shops` table. All the data in the column will be lost.
  - You are about to drop the column `sellerDeliverySubsidyPercent` on the `shops` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "shops" DROP COLUMN "deliveryFeePerKm",
DROP COLUMN "deliveryFreeKm",
DROP COLUMN "sellerDeliverySubsidyPercent";

-- CreateTable
CREATE TABLE "delivery_rate_config" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "perKmRate" DECIMAL(12,2) NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_rate_config_pkey" PRIMARY KEY ("id")
);
