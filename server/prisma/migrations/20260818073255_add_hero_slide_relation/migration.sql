-- CreateEnum
CREATE TYPE "HeroRoles" AS ENUM ('SELLER', 'BUYER', 'RIDER', 'PAYMENT');

-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL,
    "role" "HeroRoles" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "searchPlaceholder" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hero_slides_role_key" ON "hero_slides"("role");

-- CreateIndex
CREATE INDEX "hero_slides_role_idx" ON "hero_slides"("role");

-- CreateIndex
CREATE INDEX "hero_slides_isActive_idx" ON "hero_slides"("isActive");

-- AddForeignKey
ALTER TABLE "hero_slides" ADD CONSTRAINT "hero_slides_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
