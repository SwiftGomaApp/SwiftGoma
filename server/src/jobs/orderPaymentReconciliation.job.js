const cron = require("node-cron");
const { withLock } = require("../common/services/distributedLock");
const {
  reconcilePendingOrderPayments,
} = require("../features/orders/services/order.service");

function startOrderPaymentReconciliationJob() {
  cron.schedule("*/15 * * * *", async () => {
    console.log(
      "[order] Vérification des paiements de commande en attente...",
    );

    try {
      const count = await withLock(
        "order-payment-reconciliation",
        5 * 60 * 1000,
        reconcilePendingOrderPayments,
      );
      if (count > 0) {
        console.log(
          `[order] ${count} paiement(s) de commande réconcilié(s) via MbiyoPay (webhook jamais reçu).`,
        );
      }
    } catch (err) {
      console.error(
        "[order] Erreur pendant la réconciliation des paiements de commande:",
        err.message,
      );
    }
  });

  console.log(
    "[order] Job de réconciliation des paiements de commande planifié (toutes les 15 minutes).",
  );
}

module.exports = { startOrderPaymentReconciliationJob };
