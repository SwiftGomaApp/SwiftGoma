const { getPrismaClient } = require("../../../config/prisma");
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
    // Dossiers en attente d'action, utile pour un compteur de "tâches à traiter"
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

// Point d'entrée unique — agrège tout pour le dashboard admin
async function getAdminOverview() {
  const [users, sellerProfiles, kyc, plans, subscriptions, revenue, invoices] =
    await Promise.all([
      getUserStats(),
      getSellerProfileStats(),
      getKycStats(),
      getPlanStats(),
      getSubscriptionStats(),
      getSubscriptionRevenue(),
      getInvoiceStats(),
    ]);

  return {
    users,
    sellerProfiles,
    kyc,
    plans,
    subscriptions,
    revenue,
    invoices,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getUserStats,
  getSellerProfileStats,
  getKycStats,
  getPlanStats,
  getAdminOverview,
};
