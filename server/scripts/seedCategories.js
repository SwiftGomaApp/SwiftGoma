const {
  seedDefaultCategories,
} = require("../src/features/product/services/category.service");

function guardProduction() {
  const isProd = process.env.NODE_ENV === "production";
  const allowed = process.env.ALLOW_PROD_SEED === "true";

  if (isProd && !allowed) {
    console.error(
      "\nRefusing to run: NODE_ENV=production without ALLOW_PROD_SEED=true.\n" +
        "If you really mean to seed categories in production, re-run as:\n" +
        "  ALLOW_PROD_SEED=true NODE_ENV=production npm run seed:categories\n",
    );
    process.exit(1);
  }

  if (isProd && allowed) {
    console.warn(
      "\n Running against PRODUCTION (ALLOW_PROD_SEED=true). Proceed carefully.\n",
    );
  }
}

async function main() {
  guardProduction();

  console.log("Seeding categories & subcategories...\n");
  const categoryNames = await seedDefaultCategories();

  categoryNames.forEach((name) => console.log(`✅ ${name}`));

  console.log(`\n${categoryNames.length} catégorie(s) synchronisée(s).`);
  console.log("Seed terminé.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erreur pendant le seed des catégories:", err);
  process.exit(1);
});
