-- CreateEnum
CREATE TYPE "AdminPayoutProvider" AS ENUM ('PAWAPAY', 'MBIYOPAY');

-- CreateEnum
CREATE TYPE "AdminPayoutStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "admin_payouts" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "provider" "AdminPayoutProvider" NOT NULL,
    "status" "AdminPayoutStatus" NOT NULL DEFAULT 'PROCESSING',
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "beneficiary" TEXT,
    "phoneNumber" TEXT,
    "network" TEXT,
    "countryCode" TEXT,
    "providerName" TEXT,
    "customerMessage" TEXT,
    "externalId" TEXT,
    "externalStatus" TEXT,
    "providerResponse" JSONB,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_payouts_adminId_idx" ON "admin_payouts"("adminId");

-- CreateIndex
CREATE INDEX "admin_payouts_provider_idx" ON "admin_payouts"("provider");

-- CreateIndex
CREATE INDEX "admin_payouts_createdAt_idx" ON "admin_payouts"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "admin_payouts" ADD CONSTRAINT "admin_payouts_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
