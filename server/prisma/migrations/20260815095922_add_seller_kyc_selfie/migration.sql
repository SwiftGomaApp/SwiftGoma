/*
  Warnings:

  - Added the required column `selfiePublicId` to the `seller_kyc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selfieUrl` to the `seller_kyc` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "seller_kyc" ADD COLUMN     "callNotes" TEXT,
ADD COLUMN     "selfiePublicId" TEXT NOT NULL,
ADD COLUMN     "selfieUrl" TEXT NOT NULL;
