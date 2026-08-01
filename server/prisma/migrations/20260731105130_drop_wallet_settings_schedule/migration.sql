/*
  Warnings:

  - You are about to drop the column `autoPayoutEnabled` on the `wallet_settings` table. All the data in the column will be lost.
  - You are about to drop the column `payoutSchedule` on the `wallet_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wallet_settings" DROP COLUMN "autoPayoutEnabled",
DROP COLUMN "payoutSchedule";

-- DropEnum
DROP TYPE "PayoutSchedule";
