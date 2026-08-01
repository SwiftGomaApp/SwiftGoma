const cron = require("node-cron");
const { withLock } = require("../common/services/distributedLock");
const {
  reconcilePendingPayouts,
} = require("../features/wallet/services/wallet.service");

function startPayoutReconciliationJob() {
  cron.schedule("*/15 * * * *", async () => {
    console.log("[wallet] Vérification des payouts en attente...");

    try {
      const count = await withLock(
        "payout-reconciliation",
        5 * 60 * 1000,
        reconcilePendingPayouts,
      );
      if (count > 0) {
        console.log(
          `[wallet] ${count} payout(s) réconcilié(s) via MbiyoPay (webhook jamais reçu).`,
        );
      }
    } catch (err) {
      console.error(
        "[wallet] Erreur pendant la réconciliation des payouts:",
        err.message,
      );
    }
  });

  console.log(
    "[wallet] Job de réconciliation des payouts planifié (toutes les 15 minutes).",
  );
}

module.exports = { startPayoutReconciliationJob };
