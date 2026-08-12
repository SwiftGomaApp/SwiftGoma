-- CreateEnum
CREATE TYPE "AccountantReportSource" AS ENUM ('DOWNLOAD', 'EMAIL', 'SCHEDULED');

-- CreateTable
CREATE TABLE "accountant_reports" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "generatedById" TEXT,
    "generatedByLabel" TEXT NOT NULL,
    "source" "AccountantReportSource" NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "pdfPublicId" TEXT NOT NULL,
    "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summary" JSONB,
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accountant_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accountant_reports_createdAt_idx" ON "accountant_reports"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "accountant_reports_periodFrom_periodTo_idx" ON "accountant_reports"("periodFrom", "periodTo");

-- AddForeignKey
ALTER TABLE "accountant_reports" ADD CONSTRAINT "accountant_reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
