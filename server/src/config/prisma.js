const { PrismaNeon } = require("@prisma/adapter-neon");
const { PrismaClient } = require("../../generated/prisma");

const { env } = require("./env");

let prisma = null;

function getPrismaClient() {
  if (!prisma) {
    const adapter = new PrismaNeon({ connectionString: env.databaseUrl });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

async function checkDatabaseConnection(timeoutMs = 3000) {
  const client = getPrismaClient();
  const startedAt = Date.now();

  const query = client.$queryRaw`SELECT 1`;
  const timeout = new Promise((_resolve, reject) => {
    setTimeout(
      () => reject(new Error(`Database check timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    await Promise.race([query, timeout]);
    return { connected: true, latencyMs: Date.now() - startedAt, error: null };
  } catch (err) {
    console.error("[prisma] Database health check failed:", err.message);
    return { connected: false, latencyMs: null, error: err.message };
  }
}

module.exports = { getPrismaClient, checkDatabaseConnection };

// const { getPrismaClient } = require("../../config/prisma"); // adjust relative path as needed
// const prisma = getPrismaClient();

// // e.g. inside a feature service
// async function findSellerById(id) {
//   return prisma.seller.findUnique({ where: { id } });
// }
