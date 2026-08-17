-- Filet de sécurité DB contre les doubles-clics / requêtes concurrentes,
-- en complément de idempotencyGuard (couche route) déjà en place sur
-- checkout, subscribe et upgrade.
--
-- Ce sont des index UNIQUE PARTIELS (avec WHERE) : Prisma ne sait pas les
-- représenter dans schema.prisma (pas de support natif pour les contraintes
-- filtrées à ce jour), donc ils restent "non managés" par Prisma Client.
-- Ne pas les supprimer sans aussi retirer les gardes applicatives
-- correspondantes dans order.service.js et subscription.service.js.

-- Un même acheteur ne peut avoir qu'UNE commande "en cours" (en attente de
-- paiement ou de revue vendeur) par boutique à la fois.
CREATE UNIQUE INDEX "orders_buyer_shop_pending_unique"
ON "orders" ("buyerId", "shopId")
WHERE "status" IN ('AWAITING_PAYMENT', 'PENDING_SELLER_REVIEW');

-- Une même subscription ne peut avoir qu'UN paiement PENDING à la fois
-- (empêche deux dépôts pawaPay d'être déclenchés pour la même souscription
-- si subscribeToPlan/upgradeSubscription sont appelés deux fois de suite).
CREATE UNIQUE INDEX "subscription_payments_subscription_pending_unique"
ON "subscription_payments" ("subscriptionId")
WHERE "status" = 'PENDING';