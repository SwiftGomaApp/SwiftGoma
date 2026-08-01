-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "payoutChargedAmount" DECIMAL(12,2),
ADD COLUMN     "payoutFee" DECIMAL(12,2);
