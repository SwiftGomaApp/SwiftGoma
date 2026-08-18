const cron = require("node-cron");
const { withLock } = require("../common/services/distributedLock");
const {
  recalculateProductPopularity,
} = require("../features/product/services/popularity.service");

function startProductPopularityJob() {
  cron.schedule("0 */6 * * *", async () => {
    console.log("[product] Recalcul du score de popularité...");

    try {
      const count = await withLock(
        "product-popularity-recalc",
        10 * 60 * 1000,
        recalculateProductPopularity,
      );
      if (count) {
        console.log(
          `[product] Score de popularité recalculé pour ${count} produit(s).`,
        );
      }
    } catch (err) {
      console.error(
        "[product] Erreur pendant le recalcul de popularité:",
        err.message,
      );
    }
  });

  console.log(
    "[product] Job de popularité des produits planifié (toutes les 6 heures).",
  );
}

module.exports = { startProductPopularityJob };
