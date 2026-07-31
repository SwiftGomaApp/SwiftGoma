/*
  Warnings:

  - The values [PENDING_REVIEW,APPROVED,REJECTED] on the enum `SellerProfileStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `rejectionReason` on the `seller_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `seller_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `seller_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `seller_profiles` table. All the data in the column will be lost.
  - Added the required column `bannerPublicId` to the `seller_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logoPublicId` to the `seller_profiles` table without a default value. This is not possible if the table is not empty.
  - Made the column `businessDescription` on table `seller_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `logoUrl` on table `seller_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bannerUrl` on table `seller_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contactPhone` on table `seller_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contactEmail` on table `seller_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `whatsappNumber` on table `seller_profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `seller_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'SUPPORT_REVIEWED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IdDocumentType" AS ENUM ('NATIONAL_ID', 'VOTER_CARD', 'PASSPORT');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterEnum
BEGIN;
CREATE TYPE "SellerProfileStatus_new" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED');
ALTER TABLE "public"."seller_profiles" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "seller_profiles" ALTER COLUMN "status" TYPE "SellerProfileStatus_new" USING ("status"::text::"SellerProfileStatus_new");
ALTER TYPE "SellerProfileStatus" RENAME TO "SellerProfileStatus_old";
ALTER TYPE "SellerProfileStatus_new" RENAME TO "SellerProfileStatus";
DROP TYPE "public"."SellerProfileStatus_old";
ALTER TABLE "seller_profiles" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "seller_profiles" DROP COLUMN "rejectionReason",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedBy",
DROP COLUMN "submittedAt",
ADD COLUMN     "bannerPublicId" TEXT NOT NULL,
ADD COLUMN     "logoPublicId" TEXT NOT NULL,
ALTER COLUMN "businessDescription" SET NOT NULL,
ALTER COLUMN "logoUrl" SET NOT NULL,
ALTER COLUMN "bannerUrl" SET NOT NULL,
ALTER COLUMN "contactPhone" SET NOT NULL,
ALTER COLUMN "contactEmail" SET NOT NULL,
ALTER COLUMN "whatsappNumber" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL;

-- CreateTable
CREATE TABLE "seller_kyc" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "idDocumentType" "IdDocumentType" NOT NULL,
    "idDocumentUrl" TEXT NOT NULL,
    "idDocumentPublicId" TEXT NOT NULL,
    "proofOfAddressUrl" TEXT NOT NULL,
    "proofOfAddressPublicId" TEXT NOT NULL,
    "rccmNumber" TEXT,
    "rccmDocumentUrl" TEXT,
    "rccmDocumentPublicId" TEXT,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "supportReviewedBy" TEXT,
    "supportReviewedAt" TIMESTAMP(3),
    "adminReviewedBy" TEXT,
    "adminReviewedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_kyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "maxProducts" INTEGER NOT NULL,
    "maxPhotosPerProduct" INTEGER NOT NULL,
    "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_prices" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seller_kyc_sellerProfileId_key" ON "seller_kyc"("sellerProfileId");

-- CreateIndex
CREATE INDEX "seller_kyc_status_idx" ON "seller_kyc"("status");

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "plan_prices_planId_billingCycle_currency_key" ON "plan_prices"("planId", "billingCycle", "currency");

-- AddForeignKey
ALTER TABLE "seller_kyc" ADD CONSTRAINT "seller_kyc_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
