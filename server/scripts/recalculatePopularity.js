const {
  recalculateProductPopularity,
} = require("../src/features/product/services/popularity.service");

async function main() {
  console.log("Recalcul manuel du score de popularité...");

  const count = await recalculateProductPopularity();

  console.log(`Terminé — ${count} produit(s) mis à jour.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Échec du recalcul:", err.message);
  process.exit(1);
});
