const cron = require("node-cron");
const { withLock } = require("../common/services/distributedLock");
const {
  reconcileProcessingAdminPayouts,
} = require("../features/payments/services/adminPayoutStatus.service");

function startAdminPayoutReconciliationJob() {
  cron.schedule("*/15 * * * *", async () => {
    console.log("[admin-payout] Vérification des payouts admin en cours...");

    try {
      const count = await withLock(
        "admin-payout-reconciliation",
        5 * 60 * 1000,
        reconcileProcessingAdminPayouts,
      );
      if (count > 0) {
        console.log(
          `[admin-payout] ${count} payout(s) admin réconcilié(s) via PawaPay.`,
        );
      }
    } catch (err) {
      console.error(
        "[admin-payout] Erreur pendant la réconciliation des payouts admin:",
        err.message,
      );
    }
  });

  console.log(
    "[admin-payout] Job de réconciliation des payouts admin planifié (toutes les 15 minutes).",
  );
}

module.exports = { startAdminPayoutReconciliationJob };
