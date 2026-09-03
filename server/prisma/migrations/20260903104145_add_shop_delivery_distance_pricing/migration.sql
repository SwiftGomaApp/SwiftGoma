-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "deliveryFeePerKm" DECIMAL(12,2),
ADD COLUMN     "deliveryFreeKm" DOUBLE PRECISION,
ADD COLUMN     "sellerDeliverySubsidyPercent" DOUBLE PRECISION;
