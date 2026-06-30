const { prisma } = require("../../../config/db.config");
const healthService = require("./health.service");

const COMPONENTS = [
  {
    slug: "database",
    name: "Base de données",
    feature: "auth",
    check: healthService.checkDatabase,
    degradedThresholdMs: 500,
  },
  {
    slug: "redis",
    name: "Cache & files d'attente (Redis)",
    feature: "auth",
    check: healthService.checkRedis,
    degradedThresholdMs: 500,
  },
  {
    slug: "email",
    name: "Envoi d'emails",
    feature: "auth",
    check: healthService.checkEmail,
    degradedThresholdMs: 3000,
  },
  {
    slug: "sms",
    name: "Envoi de SMS",
    feature: "auth",
    check: healthService.checkSms,
    degradedThresholdMs: 3000,
  },
];

const STATUS_RANK = {
  OPERATIONAL: 0,
  DEGRADED: 1,
  PARTIAL_OUTAGE: 2,
  MAJOR_OUTAGE: 3,
};

const runHealthChecks = async () => {
  for (const def of COMPONENTS) {
    const component = await prisma.component.upsert({
      where: { slug: def.slug },
      create: { slug: def.slug, name: def.name },
      update: { name: def.name },
    });

    const result = await def.check();
    let status = result.status;
    if (
      status === "OPERATIONAL" &&
      result.responseTimeMs > def.degradedThresholdMs
    ) {
      status = "DEGRADED";
    }

    await prisma.$transaction([
      prisma.healthCheck.create({
        data: {
          componentId: component.id,
          status,
          responseTimeMs: result.responseTimeMs,
          message: result.message,
        },
      }),
      prisma.component.update({
        where: { id: component.id },
        data: { currentStatus: status, lastCheckedAt: new Date() },
      }),
    ]);
  }
};

const cleanupOldChecks = async (days = 90) => {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  await prisma.healthCheck.deleteMany({ where: { checkedAt: { lt: cutoff } } });
};

const getOverallStatus = (components) => {
  const worstRank = components.reduce(
    (acc, c) => Math.max(acc, STATUS_RANK[c.currentStatus] ?? 0),
    0,
  );
  return Object.keys(STATUS_RANK).find((key) => STATUS_RANK[key] === worstRank);
};

const getUptimeHistory = async (componentId, days = 90) => {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw`
    SELECT
      DATE("checkedAt") AS day,
      COUNT(*) FILTER (WHERE "status" IN ('OPERATIONAL', 'DEGRADED')) AS up,
      COUNT(*) AS total
    FROM "status_health_checks"
    WHERE "componentId" = ${componentId}
      AND "checkedAt" >= ${cutoff}
    GROUP BY day
    ORDER BY day ASC
  `;

  return rows.map((r) => ({
    date: r.day,
    uptimePercent:
      Number(r.total) > 0
        ? Math.round((Number(r.up) / Number(r.total)) * 1000) / 10
        : null,
  }));
};

const getPublicStatus = async () => {
  const components = await prisma.component.findMany({
    orderBy: { name: "asc" },
  });

  const componentsWithHistory = await Promise.all(
    components.map(async (c) => {
      const def = COMPONENTS.find((d) => d.slug === c.slug);
      return {
        slug: c.slug,
        name: c.name,
        feature: def?.feature ?? "general",
        status: c.currentStatus,
        lastCheckedAt: c.lastCheckedAt,
        history: await getUptimeHistory(c.id, 90),
      };
    }),
  );

  const activeIncidents = await prisma.incident.findMany({
    where: { status: { not: "RESOLVED" } },
    include: { updates: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const recentResolvedIncidents = await prisma.incident.findMany({
    where: { status: "RESOLVED" },
    include: { updates: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    overallStatus: getOverallStatus(components),
    components: componentsWithHistory,
    activeIncidents,
    recentResolvedIncidents,
  };
};

module.exports = {
  runHealthChecks,
  cleanupOldChecks,
  getPublicStatus,
  getUptimeHistory,
};
