/*
  Warnings:

  - A unique constraint covering the columns `[orderPaymentId,type]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "orderPaymentId" TEXT,
ALTER COLUMN "subscriptionPaymentId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "invoices_orderPaymentId_type_key" ON "invoices"("orderPaymentId", "type");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_orderPaymentId_fkey" FOREIGN KEY ("orderPaymentId") REFERENCES "order_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
