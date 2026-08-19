-- Remplace les index mono-colonne sur `orders` par des index composites
-- alignés sur les requêtes réellement exécutées :
--   - listOrdersForBuyer / listOrdersForShop / listOrdersForRider et
--     listAdminOrders filtrent par buyerId/shopId/riderId + status,
--     triés par createdAt desc.
--   - Les jobs cron (expireStale*, failOneStuckOnTheWayOrder,
--     unassignOneStaleRiderOrder, etc.) filtrent par status + createdAt
--     seuls, sans buyerId/shopId/riderId.
--
-- Grâce à la règle du "leftmost prefix" des index B-tree Postgres, ces
-- index composites couvrent aussi les recherches sur la seule première
-- colonne (ex. buyerId seul), donc les anciens index mono-colonne
-- deviennent redondants et sont supprimés.

DROP INDEX IF EXISTS "orders_buyerId_idx";
DROP INDEX IF EXISTS "orders_shopId_idx";
DROP INDEX IF EXISTS "orders_riderId_idx";
DROP INDEX IF EXISTS "orders_status_idx";

CREATE INDEX "orders_buyerId_status_createdAt_idx" ON "orders" ("buyerId", "status", "createdAt");
CREATE INDEX "orders_shopId_status_createdAt_idx" ON "orders" ("shopId", "status", "createdAt");
CREATE INDEX "orders_riderId_status_createdAt_idx" ON "orders" ("riderId", "status", "createdAt");
CREATE INDEX "orders_status_createdAt_idx" ON "orders" ("status", "createdAt");
