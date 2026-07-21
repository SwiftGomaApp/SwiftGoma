const cron = require("node-cron");
const {
  runRenewalCycle,
} = require("../features/subscriptions/services/subscription.service");

function startSubscriptionRenewalJob() {
  cron.schedule("0 6 * * *", async () => {
    console.log("[renewal] Démarrage du cycle de renouvellement quotidien...");
    try {
      await runRenewalCycle();
    } catch (err) {
      console.error(
        "[renewal] Erreur pendant le cycle de renouvellement:",
        err.message,
      );
    }
  });

  console.log(
    "[renewal] Job de renouvellement planifié (tous les jours à 06:00).",
  );
}

module.exports = { startSubscriptionRenewalJob };
