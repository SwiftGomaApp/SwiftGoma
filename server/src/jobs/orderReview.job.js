const cron = require("node-cron");
const { withLock } = require("../common/services/distributedLock");
const {
  expireUnansweredOrders,
} = require("../features/orders/services/order.service");

function startOrderReviewJob() {
  cron.schedule("*/15 * * * *", async () => {
    console.log("[order] Vérification des commandes en attente de réponse...");

    try {
      const count = await withLock(
        "order-review",
        5 * 60 * 1000,
        expireUnansweredOrders,
      );
      if (count > 0) {
        console.log(
          `[order] ${count} commande(s) expirée(s) faute de réponse du vendeur.`,
        );
      }
    } catch (err) {
      console.error(
        "[order] Erreur pendant la vérification des commandes expirées:",
        err.message,
      );
    }
  });

  console.log(
    "[order] Job de timeout de review vendeur planifié (toutes les 15 minutes).",
  );
}

module.exports = { startOrderReviewJob };
