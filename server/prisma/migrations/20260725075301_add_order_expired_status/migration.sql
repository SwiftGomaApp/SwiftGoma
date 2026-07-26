/*
  Warnings:

  - You are about to drop the column `currency` on the `wallet_settings` table. All the data in the column will be lost.
  - You are about to drop the column `minimumPayoutAmount` on the `wallet_settings` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('ORDER_CREDIT', 'PAYOUT_DEBIT', 'REFUND_DEBIT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "wallet_settings" DROP COLUMN "currency",
DROP COLUMN "minimumPayoutAmount";

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_balances" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "wallet_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "walletBalanceId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "status" "WalletTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "reason" TEXT,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "orderId" TEXT,
    "payoutOrderId" TEXT,
    "payoutTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minimum_payout_amounts" (
    "id" TEXT NOT NULL,
    "walletSettingsId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "minimum_payout_amounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_sellerProfileId_key" ON "wallets"("sellerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_balances_walletId_currency_key" ON "wallet_balances"("walletId", "currency");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletBalanceId_idx" ON "wallet_transactions"("walletBalanceId");

-- CreateIndex
CREATE UNIQUE INDEX "minimum_payout_amounts_walletSettingsId_currency_key" ON "minimum_payout_amounts"("walletSettingsId", "currency");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_balances" ADD CONSTRAINT "wallet_balances_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletBalanceId_fkey" FOREIGN KEY ("walletBalanceId") REFERENCES "wallet_balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minimum_payout_amounts" ADD CONSTRAINT "minimum_payout_amounts_walletSettingsId_fkey" FOREIGN KEY ("walletSettingsId") REFERENCES "wallet_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
