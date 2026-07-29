-- AlterTable
ALTER TABLE "subscription_payments" ADD COLUMN     "mobileMoneyProvider" TEXT;

-- CreateTable
CREATE TABLE "document_sequences" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("id")
);
