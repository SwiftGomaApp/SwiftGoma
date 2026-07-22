-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "shops" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "bannerUrl" TEXT,
    "bannerPublicId" TEXT,
    "deliveryFee" DECIMAL(12,2) NOT NULL,
    "deliveryFeeCurrency" TEXT NOT NULL,
    "status" "ShopStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shops_sellerProfileId_key" ON "shops"("sellerProfileId");

-- CreateIndex
CREATE INDEX "shops_status_idx" ON "shops"("status");

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
