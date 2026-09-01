-- AlterEnum
ALTER TYPE "OrderMessageSenderRole" ADD VALUE 'SELLER';

-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "address" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
