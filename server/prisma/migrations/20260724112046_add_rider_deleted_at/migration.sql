-- CreateEnum
CREATE TYPE "RiderStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MOTORCYCLE', 'BICYCLE', 'CAR', 'ON_FOOT');

-- CreateTable
CREATE TABLE "riders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "status" "RiderStatus" NOT NULL DEFAULT 'PENDING',
    "vehicleType" "VehicleType",
    "photoUrl" TEXT,
    "photoPublicId" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "riders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "riders_userId_key" ON "riders"("userId");

-- CreateIndex
CREATE INDEX "riders_sellerProfileId_idx" ON "riders"("sellerProfileId");

-- AddForeignKey
ALTER TABLE "riders" ADD CONSTRAINT "riders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riders" ADD CONSTRAINT "riders_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
