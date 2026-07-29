const autocannon = require("autocannon");

console.log("autocannon version:", require("autocannon/package.json").version);
console.log("node version:", process.version);

// Cible: ton serveur local. Change le port si besoin.
const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
  process.exit(1);
});

async function runOne(label, url) {
  console.log(`\n=== ${label} ===`);
  console.log(`Démarrage à ${new Date().toISOString()}...`);

  const result = await autocannon({
    url,
    connections: 20,
    duration: 5, // raccourci à 5s pour itérer plus vite pendant le debug
  });

  console.log(`Terminé à ${new Date().toISOString()}.`);
  console.log("Résultat brut (au cas où printResult échoue silencieusement):");
  console.log(
    JSON.stringify(
      {
        requests: result.requests,
        latency: result.latency,
        throughput: result.throughput,
        errors: result.errors,
        timeouts: result.timeouts,
      },
      null,
      2,
    ),
  );

  try {
    autocannon.printResult(result);
  } catch (printErr) {
    console.error("printResult() a levé une erreur:", printErr);
  }
}

async function run() {
  await runOne(
    "Test 1: GET /products (sans filtre, page 1)",
    `${BASE_URL}/api/v1/products`,
  );
  await runOne(
    "Test 2: GET /products/categories",
    `${BASE_URL}/api/v1/products/categories`,
  );
  await runOne(
    "Test 3: GET /products avec recherche",
    `${BASE_URL}/api/v1/products?search=test&sortBy=priceAsc`,
  );
  console.log("\n=== Tous les tests sont terminés ===");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Load test failed:", err);
    process.exit(1);
  });
