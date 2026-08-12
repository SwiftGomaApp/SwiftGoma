const cache = require("../src/common/services/cache");

async function main() {
  const namespace = process.argv[2];

  if (!cache.isAvailable()) {
    console.log("Redis is not configured — nothing to clear.");
    process.exit(0);
  }

  if (namespace) {
    const count = await cache.clearNamespace(namespace);
    const version = await cache.getVersion(namespace);
    console.log(
      `Cleared ${count} cache key(s) for "${namespace}". Version is now ${version}.`,
    );
    process.exit(0);
  }

  const count = await cache.clearNamespace("");
  console.log(`Cleared ${count} cache key(s) (all namespaces).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to clear cache:", err.message);
  process.exit(1);
});
