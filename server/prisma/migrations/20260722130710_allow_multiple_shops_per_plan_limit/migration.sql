/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `shops` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "shops_sellerProfileId_key";

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "maxShops" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "shops_slug_key" ON "shops"("slug");

-- CreateIndex
CREATE INDEX "shops_sellerProfileId_idx" ON "shops"("sellerProfileId");
