-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_orderId_type_key" ON "wallet_transactions"("orderId", "type");
