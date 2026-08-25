const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../../generated/prisma");

const { env } = require("./env");

let prisma = null;

function getPrismaClient() {
  if (!prisma) {
    // Plain Postgres over TCP (via `pg`), not Neon's WebSocket adapter — the
    // WebSocket handshake to Neon was intermittently hanging for ~75s on
    // networks that silently drop WS upgrades (VPN/firewall) while plain
    // Postgres/TCP is unaffected. Uses the direct (non-pooler) endpoint since
    // `pg.Pool` manages its own connection pool.
    const adapter = new PrismaPg({
      connectionString: env.directUrl || env.databaseUrl,
      connectionTimeoutMillis: 8000,
    });
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
