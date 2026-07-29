const cron = require("node-cron");
const {
  expireUnansweredOrders,
} = require("../features/orders/services/order.service");

let isRunning = false;

function startOrderReviewJob() {
  cron.schedule("*/15 * * * *", async () => {
    if (isRunning) {
      console.warn(
        "[order] Cycle précédent encore en cours — on saute ce tick pour éviter le chevauchement.",
      );
      return;
    }

    isRunning = true;
    console.log("[order] Vérification des commandes en attente de réponse...");

    try {
      const count = await expireUnansweredOrders();
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
    } finally {
      isRunning = false;
    }
  });

  console.log(
    "[order] Job de timeout de review vendeur planifié (toutes les 15 minutes).",
  );
}

module.exports = { startOrderReviewJob };
