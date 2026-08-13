const { getPrismaClient } = require("../../../config/prisma");
const {
  getContactMessageStats,
} = require("../../support/services/support.service");
const {
  getSubscriptionStats,
  getSubscriptionRevenue,
} = require("../../subscriptions/services/subscription.service");
const { getInvoiceStats } = require("../../invoicing/services/invoice.service");

const prisma = getPrismaClient();

async function getUserStats() {
  const [byRole, byStatus, totalCount] = await Promise.all([
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
      where: { deletedAt: null },
    }),
    prisma.user.groupBy({
      by: ["isBlocked"],
      _count: { _all: true },
      where: { deletedAt: null },
    }),
    prisma.user.count(),
  ]);

  const roleMap = byRole.reduce((acc, row) => {
    acc[row.role] = row._count._all;
    return acc;
  }, {});

  const blockedCount =
    byStatus.find((row) => row.isBlocked === true)?._count._all ?? 0;
  const activeCount =
    byStatus.find((row) => row.isBlocked === false)?._count._all ?? 0;

  const deletedCount = await prisma.user.count({
    where: { deletedAt: { not: null } },
  });

  return {
    total: totalCount,
    byRole: {
      BUYER: roleMap.BUYER ?? 0,
      SELLER: roleMap.SELLER ?? 0,
      RIDER: roleMap.RIDER ?? 0,
      ADMIN: roleMap.ADMIN ?? 0,
      SUPPORT: roleMap.SUPPORT ?? 0,
      ACCOUNTANT: roleMap.ACCOUNTANT ?? 0,
    },
    blocked: blockedCount,
    active: activeCount,
    deleted: deletedCount,
  };
}

async function getSellerProfileStats() {
  const [byStatus, totalCount] = await Promise.all([
    prisma.sellerProfile.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.sellerProfile.count(),
  ]);

  const statusMap = byStatus.reduce((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  return {
    total: totalCount,
    byStatus: {
      DRAFT: statusMap.DRAFT ?? 0,
      ACTIVE: statusMap.ACTIVE ?? 0,
      SUSPENDED: statusMap.SUSPENDED ?? 0,
    },
  };
}

async function getKycStats() {
  const [byStatus, totalCount] = await Promise.all([
    prisma.sellerKyc.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.sellerKyc.count(),
  ]);

  const statusMap = byStatus.reduce((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  return {
    total: totalCount,
    byStatus: {
      PENDING: statusMap.PENDING ?? 0,
      SUPPORT_REVIEWED: statusMap.SUPPORT_REVIEWED ?? 0,
      APPROVED: statusMap.APPROVED ?? 0,
      REJECTED: statusMap.REJECTED ?? 0,
    },

    pendingAction: (statusMap.PENDING ?? 0) + (statusMap.SUPPORT_REVIEWED ?? 0),
  };
}

async function getPlanStats() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { subscriptions: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return plans.map((p) => ({
    planId: p.id,
    name: p.name,
    slug: p.slug,
    subscriptionCount: p._count.subscriptions,
  }));
}

async function getOrderStats() {
  const [byStatus, totalCount, gmvByCurrency] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.order.count(),

    prisma.order.groupBy({
      by: ["currency"],
      where: { status: "COMPLETED" },
      _sum: { total: true },
      _count: { _all: true },
    }),
  ]);

  const statusMap = byStatus.reduce((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  return {
    total: totalCount,
    byStatus: {
      AWAITING_PAYMENT: statusMap.AWAITING_PAYMENT ?? 0,
      PENDING_SELLER_REVIEW: statusMap.PENDING_SELLER_REVIEW ?? 0,
      ACCEPTED: statusMap.ACCEPTED ?? 0,
      REJECTED: statusMap.REJECTED ?? 0,
      READY_FOR_PICKUP: statusMap.READY_FOR_PICKUP ?? 0,
      RIDER_ASSIGNED: statusMap.RIDER_ASSIGNED ?? 0,
      PICKED_UP: statusMap.PICKED_UP ?? 0,
      ON_THE_WAY: statusMap.ON_THE_WAY ?? 0,
      DELIVERED: statusMap.DELIVERED ?? 0,
      COMPLETED: statusMap.COMPLETED ?? 0,
      CANCELLED: statusMap.CANCELLED ?? 0,
      EXPIRED: statusMap.EXPIRED ?? 0,
      FAILED: statusMap.FAILED ?? 0,
    },

    awaitingAction:
      (statusMap.PENDING_SELLER_REVIEW ?? 0) + (statusMap.RIDER_ASSIGNED ?? 0),
    gmvByCurrency: gmvByCurrency.map((row) => ({
      currency: row.currency,
      total: row._sum.total,
      orderCount: row._count._all,
    })),
  };
}

async function getShopStats() {
  const [byStatus, totalCount] = await Promise.all([
    prisma.shop.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { deletedAt: null },
    }),
    prisma.shop.count({ where: { deletedAt: null } }),
  ]);

  const statusMap = byStatus.reduce((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  return {
    total: totalCount,
    byStatus: {
      DRAFT: statusMap.DRAFT ?? 0,
      PUBLISHED: statusMap.PUBLISHED ?? 0,
      SUSPENDED: statusMap.SUSPENDED ?? 0,
    },
  };
}

async function getProductStats() {
  const [byStatus, totalCount] = await Promise.all([
    prisma.product.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.product.count(),
  ]);

  const statusMap = byStatus.reduce((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  return {
    total: totalCount,
    byStatus: {
      DRAFT: statusMap.DRAFT ?? 0,
      PUBLISHED: statusMap.PUBLISHED ?? 0,
    },
  };
}

const ALLOWED_METRIC_DAYS = [7, 30, 90];
const ALLOWED_METRIC_CURRENCIES = ["USD", "CDF"];

async function getDashboardMetrics({ days = 30, currency = "USD" } = {}) {
  const safeDays = ALLOWED_METRIC_DAYS.includes(Number(days))
    ? Number(days)
    : 30;
  const safeCurrency = ALLOWED_METRIC_CURRENCIES.includes(currency)
    ? currency
    : "USD";

  const rows = await prisma.$queryRaw`
    WITH bounds AS (
      SELECT
        (CURRENT_DATE - (${safeDays}::int - 1)) AS start_date,
        CURRENT_DATE AS end_date
    ),
    date_series AS (
      SELECT generate_series(
        (SELECT start_date FROM bounds),
        (SELECT end_date FROM bounds),
        INTERVAL '1 day'
      )::date AS date
    ),
    orders_by_day AS (
      SELECT DATE("createdAt") AS date, COUNT(*)::int AS orders
      FROM "orders"
      WHERE "createdAt" >= (SELECT start_date FROM bounds)
      GROUP BY DATE("createdAt")
    ),
    gmv_by_day AS (
      SELECT DATE("createdAt") AS date, COALESCE(SUM(total), 0)::float AS gmv
      FROM "orders"
      WHERE status = 'COMPLETED'
        AND currency = ${safeCurrency}
        AND "createdAt" >= (SELECT start_date FROM bounds)
      GROUP BY DATE("createdAt")
    ),
    users_by_day AS (
      SELECT DATE("createdAt") AS date, COUNT(*)::int AS "newUsers"
      FROM "users"
      WHERE "createdAt" >= (SELECT start_date FROM bounds)
      GROUP BY DATE("createdAt")
    ),
    sellers_by_day AS (
      SELECT DATE("createdAt") AS date, COUNT(*)::int AS "newSellers"
      FROM "seller_profiles"
      WHERE "createdAt" >= (SELECT start_date FROM bounds)
      GROUP BY DATE("createdAt")
    ),
    kyc_by_day AS (
      SELECT DATE("createdAt") AS date, COUNT(*)::int AS "kycSubmissions"
      FROM "seller_kyc"
      WHERE "createdAt" >= (SELECT start_date FROM bounds)
      GROUP BY DATE("createdAt")
    ),
    shops_by_day AS (
      SELECT DATE("publishedAt") AS date, COUNT(*)::int AS "shopsPublished"
      FROM "shops"
      WHERE "publishedAt" IS NOT NULL
        AND "publishedAt" >= (SELECT start_date FROM bounds)
      GROUP BY DATE("publishedAt")
    )
    SELECT
      TO_CHAR(ds.date, 'YYYY-MM-DD') AS date,
      COALESCE(o.orders, 0) AS orders,
      COALESCE(g.gmv, 0) AS gmv,
      COALESCE(u."newUsers", 0) AS "newUsers",
      COALESCE(sp."newSellers", 0) AS "newSellers",
      COALESCE(k."kycSubmissions", 0) AS "kycSubmissions",
      COALESCE(sh."shopsPublished", 0) AS "shopsPublished"
    FROM date_series ds
    LEFT JOIN orders_by_day o ON o.date = ds.date
    LEFT JOIN gmv_by_day g ON g.date = ds.date
    LEFT JOIN users_by_day u ON u.date = ds.date
    LEFT JOIN sellers_by_day sp ON sp.date = ds.date
    LEFT JOIN kyc_by_day k ON k.date = ds.date
    LEFT JOIN shops_by_day sh ON sh.date = ds.date
    ORDER BY ds.date ASC;
  `;

  return {
    days: safeDays,
    currency: safeCurrency,
    series: rows,
  };
}

async function getSupportMetrics({ days = 30 } = {}) {
  const safeDays = ALLOWED_METRIC_DAYS.includes(Number(days))
    ? Number(days)
    : 30;

  const rows = await prisma.$queryRaw`
    WITH bounds AS (
      SELECT
        (CURRENT_DATE - (${safeDays}::int - 1)) AS start_date,
        CURRENT_DATE AS end_date
    ),
    date_series AS (
      SELECT generate_series(
        (SELECT start_date FROM bounds),
        (SELECT end_date FROM bounds),
        INTERVAL '1 day'
      )::date AS date
    ),
    users_by_day AS (
      SELECT DATE("createdAt") AS date, COUNT(*)::int AS "newUsers"
      FROM "users"
      WHERE "createdAt" >= (SELECT start_date FROM bounds)
      GROUP BY DATE("createdAt")
    ),
    sellers_by_day AS (
      SELECT DATE("createdAt") AS date, COUNT(*)::int AS "newSellers"
      FROM "seller_profiles"
      WHERE "createdAt" >= (SELECT start_date FROM bounds)
      GROUP BY DATE("createdAt")
    ),
    kyc_by_day AS (
      SELECT DATE("createdAt") AS date, COUNT(*)::int AS "kycSubmissions"
      FROM "seller_kyc"
      WHERE "createdAt" >= (SELECT start_date FROM bounds)
      GROUP BY DATE("createdAt")
    ),
    shops_by_day AS (
      SELECT DATE("publishedAt") AS date, COUNT(*)::int AS "shopsPublished"
      FROM "shops"
      WHERE "publishedAt" IS NOT NULL
        AND "publishedAt" >= (SELECT start_date FROM bounds)
      GROUP BY DATE("publishedAt")
    )
    SELECT
      TO_CHAR(ds.date, 'YYYY-MM-DD') AS date,
      COALESCE(u."newUsers", 0) AS "newUsers",
      COALESCE(sp."newSellers", 0) AS "newSellers",
      COALESCE(k."kycSubmissions", 0) AS "kycSubmissions",
      COALESCE(sh."shopsPublished", 0) AS "shopsPublished"
    FROM date_series ds
    LEFT JOIN users_by_day u ON u.date = ds.date
    LEFT JOIN sellers_by_day sp ON sp.date = ds.date
    LEFT JOIN kyc_by_day k ON k.date = ds.date
    LEFT JOIN shops_by_day sh ON sh.date = ds.date
    ORDER BY ds.date ASC;
  `;

  return { days: safeDays, series: rows };
}

async function getSupportOverview() {
  const [
    users,
    sellerProfiles,
    kyc,
    shops,
    products,
    categoriesCount,
    blogPostsCount,
    contactMessages,
  ] = await Promise.all([
    getUserStats(),
    getSellerProfileStats(),
    getKycStats(),
    getShopStats(),
    getProductStats(),
    prisma.category.count(),
    prisma.blogPost.count(),
    getContactMessageStats(),
  ]);

  return {
    users: {
      total: users.total,
      byRole: {
        BUYER: users.byRole.BUYER ?? 0,
        SELLER: users.byRole.SELLER ?? 0,
        RIDER: users.byRole.RIDER ?? 0,
      },
      blocked: users.blocked,
    },
    sellerProfiles,
    kyc: {
      total: kyc.total,
      byStatus: kyc.byStatus,
      pendingAction: kyc.pendingAction,
      awaitingSupportReview: kyc.byStatus.PENDING ?? 0,
      awaitingAdminApproval: kyc.byStatus.SUPPORT_REVIEWED ?? 0,
    },
    shops,
    products,
    catalog: {
      categories: categoriesCount,
      blogPosts: blogPostsCount,
    },
    contactMessages,
    generatedAt: new Date().toISOString(),
  };
}

async function getAdminOverview() {
  const [
    users,
    sellerProfiles,
    kyc,
    plans,
    subscriptions,
    revenue,
    invoices,
    orders,
    shops,
    products,
  ] = await Promise.all([
    getUserStats(),
    getSellerProfileStats(),
    getKycStats(),
    getPlanStats(),
    getSubscriptionStats(),
    getSubscriptionRevenue(),
    getInvoiceStats(),
    getOrderStats(),
    getShopStats(),
    getProductStats(),
  ]);

  return {
    users,
    sellerProfiles,
    kyc,
    plans,
    subscriptions,
    revenue,
    invoices,
    orders,
    shops,
    products,
    generatedAt: new Date().toISOString(),
  };
}

async function getAccountantOverview() {
  const [
    invoices,
    subscriptions,
    revenue,
    orders,
    adminPayouts,
    walletPayouts,
  ] = await Promise.all([
    getInvoiceStats(),
    getSubscriptionStats(),
    getSubscriptionRevenue(),
    getOrderStats(),
    prisma.adminPayout.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.walletTransaction.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { type: "PAYOUT_DEBIT" },
    }),
  ]);

  const adminPayoutMap = adminPayouts.reduce((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  const walletPayoutMap = walletPayouts.reduce((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  return {
    invoices,
    subscriptions,
    revenue,
    orders: {
      total: orders.total,
      completed: orders.byStatus.COMPLETED ?? 0,
      gmvByCurrency: orders.gmvByCurrency,
    },
    adminPayouts: {
      total: Object.values(adminPayoutMap).reduce((sum, n) => sum + n, 0),
      byStatus: {
        PROCESSING: adminPayoutMap.PROCESSING ?? 0,
        COMPLETED: adminPayoutMap.COMPLETED ?? 0,
        FAILED: adminPayoutMap.FAILED ?? 0,
      },
    },
    sellerPayouts: {
      total: Object.values(walletPayoutMap).reduce((sum, n) => sum + n, 0),
      byStatus: walletPayoutMap,
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getUserStats,
  getSellerProfileStats,
  getKycStats,
  getPlanStats,
  getOrderStats,
  getShopStats,
  getProductStats,
  getDashboardMetrics,
  getSupportMetrics,
  getAdminOverview,
  getSupportOverview,
  getAccountantOverview,
};
