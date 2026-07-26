-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_SELLER_REVIEW', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "OrderPaymentMethod" AS ENUM ('CASH_ON_DELIVERY', 'ONLINE_PAYMENT');

-- CreateEnum
CREATE TYPE "OrderFulfillmentMethod" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'RELEASED', 'REFUNDED', 'FAILED');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "riderId" TEXT,
    "paymentMethod" "OrderPaymentMethod" NOT NULL,
    "fulfillmentMethod" "OrderFulfillmentMethod" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_SELLER_REVIEW',
    "currency" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "deliveryFee" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "deliveryAddress" TEXT,
    "qrToken" TEXT NOT NULL,
    "qrScannedAt" TIMESTAMP(3),
    "cashCollected" DECIMAL(12,2),
    "rejectionReason" TEXT,
    "cancelReason" TEXT,
    "failureReason" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "variantName" TEXT,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MBIYOPAY',
    "network" TEXT,
    "phoneNumber" TEXT,
    "countryCode" TEXT,
    "payinOrderId" TEXT,
    "payinTransactionId" TEXT,
    "payoutOrderId" TEXT,
    "payoutTransactionId" TEXT,
    "status" "OrderPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "heldAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_qrToken_key" ON "orders"("qrToken");

-- CreateIndex
CREATE INDEX "orders_buyerId_idx" ON "orders"("buyerId");

-- CreateIndex
CREATE INDEX "orders_shopId_idx" ON "orders"("shopId");

-- CreateIndex
CREATE INDEX "orders_riderId_idx" ON "orders"("riderId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_payments_orderId_key" ON "order_payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_payments_payinOrderId_key" ON "order_payments"("payinOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_payments_payinTransactionId_key" ON "order_payments"("payinTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "order_payments_payoutOrderId_key" ON "order_payments"("payoutOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_payments_payoutTransactionId_key" ON "order_payments"("payoutTransactionId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "riders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
