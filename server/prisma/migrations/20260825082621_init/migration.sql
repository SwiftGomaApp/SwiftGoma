-- DropIndex
DROP INDEX "orders_buyerId_status_createdAt_idx";

-- DropIndex
DROP INDEX "orders_riderId_status_createdAt_idx";

-- DropIndex
DROP INDEX "orders_shopId_status_createdAt_idx";

-- DropIndex
DROP INDEX "orders_status_createdAt_idx";

-- CreateIndex
CREATE INDEX "orders_buyerId_idx" ON "orders"("buyerId");

-- CreateIndex
CREATE INDEX "orders_shopId_idx" ON "orders"("shopId");

-- CreateIndex
CREATE INDEX "orders_riderId_idx" ON "orders"("riderId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");
