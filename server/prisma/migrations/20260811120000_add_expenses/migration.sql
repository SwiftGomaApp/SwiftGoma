-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('OPERATIONS', 'MARKETING', 'PAYROLL', 'LEGAL', 'TRAVEL', 'UTILITIES', 'EQUIPMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "incurredAt" TIMESTAMP(3) NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorPhone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'COD',
    "providerName" TEXT NOT NULL,
    "customerMessage" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "receiptPublicId" TEXT,
    "adminPayoutId" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expenses_reference_key" ON "expenses"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_adminPayoutId_key" ON "expenses"("adminPayoutId");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_incurredAt_idx" ON "expenses"("incurredAt" DESC);

-- CreateIndex
CREATE INDEX "expenses_createdById_idx" ON "expenses"("createdById");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_adminPayoutId_fkey" FOREIGN KEY ("adminPayoutId") REFERENCES "admin_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
