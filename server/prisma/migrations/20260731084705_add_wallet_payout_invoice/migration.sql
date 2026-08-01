/*
  Warnings:

  - A unique constraint covering the columns `[walletTransactionId,type]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "InvoiceDocumentType" ADD VALUE 'PAYOUT_RECEIPT';

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "walletTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "invoices_walletTransactionId_type_key" ON "invoices"("walletTransactionId", "type");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "wallet_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
