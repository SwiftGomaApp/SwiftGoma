-- CreateEnum
CREATE TYPE "PayoutSchedule" AS ENUM ('MANUAL', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "wallet_settings" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "payoutPhoneNumber" TEXT NOT NULL,
    "payoutProvider" TEXT NOT NULL,
    "payoutCountry" TEXT NOT NULL,
    "autoPayoutEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutSchedule" "PayoutSchedule" NOT NULL DEFAULT 'MANUAL',
    "minimumPayoutAmount" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_settings_sellerProfileId_key" ON "wallet_settings"("sellerProfileId");

-- AddForeignKey
ALTER TABLE "wallet_settings" ADD CONSTRAINT "wallet_settings_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
