-- CreateEnum
CREATE TYPE "InvoiceDocumentType" AS ENUM ('INVOICE', 'RECEIPT');

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "type" "InvoiceDocumentType" NOT NULL,
    "subscriptionPaymentId" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "pdfPublicId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_documentNumber_key" ON "invoices"("documentNumber");

-- CreateIndex
CREATE INDEX "invoices_sellerProfileId_idx" ON "invoices"("sellerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_subscriptionPaymentId_type_key" ON "invoices"("subscriptionPaymentId", "type");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionPaymentId_fkey" FOREIGN KEY ("subscriptionPaymentId") REFERENCES "subscription_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
