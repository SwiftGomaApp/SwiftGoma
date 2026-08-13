const cron = require("node-cron");
const { withLock } = require("../common/services/distributedLock");
const {
  completeStaleDeliveredOrders,
  expireStuckOnTheWayOrders,
  unassignStaleRiderOrders,
  remindStaleDeliveryOrders,
} = require("../features/orders/services/order.service");

function startOrderDeliveryJob() {
  cron.schedule("*/15 * * * *", async () => {
    console.log("[order] Vérification des livraisons bloquées...");

    try {
      const reminded = await withLock(
        "order-delivery-remind",
        5 * 60 * 1000,
        remindStaleDeliveryOrders,
      );
      if (reminded > 0) {
        console.log(`[order] ${reminded} rappel(s) de livraison envoyé(s).`);
      }

      const unassigned = await withLock(
        "order-delivery-unassign",
        5 * 60 * 1000,
        unassignStaleRiderOrders,
      );
      if (unassigned > 0) {
        console.log(
          `[order] ${unassigned} commande(s) — livreur désassigné (RIDER_ASSIGNED → ACCEPTED).`,
        );
      }

      const failed = await withLock(
        "order-delivery-fail",
        5 * 60 * 1000,
        expireStuckOnTheWayOrders,
      );
      if (failed > 0) {
        console.log(
          `[order] ${failed} commande(s) — livraison échouée (ON_THE_WAY → FAILED).`,
        );
      }

      const completed = await withLock(
        "order-delivery-complete",
        5 * 60 * 1000,
        completeStaleDeliveredOrders,
      );
      if (completed > 0) {
        console.log(
          `[order] ${completed} commande(s) — auto-terminée(s) (DELIVERED → COMPLETED).`,
        );
      }
    } catch (err) {
      console.error(
        "[order] Erreur pendant la vérification des livraisons:",
        err.message,
      );
    }
  });

  console.log(
    "[order] Job d'automation livraison planifié (toutes les 15 minutes).",
  );
}

module.exports = { startOrderDeliveryJob };
