const { getPrismaClient } = require("../../../config/prisma");
const cache = require("../../../common/services/cache");

const ADMIN_TRANSACTIONS_TTL_SECONDS = 300;

function parsePagination(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function extractExternalMeta(provider, result = {}) {
  if (provider === "pawapay") {
    return {
      externalId: result.payoutId || null,
      externalStatus:
        result.status ||
        result.data?.status ||
        result.payoutStatus ||
        null,
    };
  }

  return {
    externalId:
      result.orderId ||
      result.transaction_id ||
      result.transactionId ||
      result.id ||
      null,
    externalStatus: result.status || null,
  };
}

function mapPayoutInput(provider, payoutInput = {}) {
  if (provider === "pawapay") {
    return {
      amount: payoutInput.amount,
      currency: payoutInput.currency,
      beneficiary: payoutInput.recipientPhoneNumber,
      phoneNumber: payoutInput.recipientPhoneNumber,
      countryCode: payoutInput.country,
      providerName: payoutInput.provider,
      customerMessage: payoutInput.customerMessage,
    };
  }

  return {
    amount: payoutInput.amount,
    currency: payoutInput.currency,
    beneficiary: payoutInput.beneficiary,
    phoneNumber: payoutInput.phoneNumber,
    network: payoutInput.network,
    countryCode: payoutInput.countryCode,
  };
}

function buildAdminTransactionsCacheKey(provider, query, version) {
  const { page, limit } = parsePagination(query);
  const parts = [
    `v${version}`,
    provider?.toUpperCase() || "ALL",
    String(query.status || "").toUpperCase(),
    String(query.search || "").trim().toLowerCase(),
    page,
    limit,
  ];
  return `admin-transactions:list:${parts.join(":")}`;
}

async function invalidateAdminTransactionsCache() {
  await cache.bumpVersion("admin-transactions");
}

async function fetchAdminPayoutsFromDb(provider, query = {}) {
  const prisma = getPrismaClient();
  const { page, limit, skip } = parsePagination(query);

  const where = {};

  if (provider) {
    where.provider = provider.toUpperCase();
  }

  if (query.status) {
    where.status = String(query.status).toUpperCase();
  }

  const search = String(query.search || "").trim();
  if (search) {
    where.OR = [
      { beneficiary: { contains: search, mode: "insensitive" } },
      { externalId: { contains: search, mode: "insensitive" } },
      { phoneNumber: { contains: search, mode: "insensitive" } },
      { providerName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.adminPayout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        admin: { select: { id: true, name: true } },
      },
    }),
    prisma.adminPayout.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      amount: item.amount?.toString?.() ?? item.amount,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function recordAdminPayout({
  adminId,
  provider,
  payoutInput,
  result = null,
  status = "PROCESSING",
  failureReason = null,
}) {
  const prisma = getPrismaClient();
  const mapped = mapPayoutInput(provider, payoutInput);
  const external = result ? extractExternalMeta(provider, result) : {};

  const payout = await prisma.adminPayout.create({
    data: {
      adminId,
      provider: provider.toUpperCase(),
      status,
      amount: mapped.amount,
      currency: mapped.currency,
      beneficiary: mapped.beneficiary,
      phoneNumber: mapped.phoneNumber,
      network: mapped.network,
      countryCode: mapped.countryCode,
      providerName: mapped.providerName,
      customerMessage: mapped.customerMessage,
      externalId: external.externalId,
      externalStatus: external.externalStatus,
      providerResponse: result || undefined,
      failureReason,
    },
    include: {
      admin: { select: { id: true, name: true } },
    },
  });

  await invalidateAdminTransactionsCache();
  return payout;
}

async function updateAdminPayout(id, data = {}) {
  const prisma = getPrismaClient();
  const payout = await prisma.adminPayout.update({
    where: { id },
    data,
    include: {
      admin: { select: { id: true, name: true } },
    },
  });

  await invalidateAdminTransactionsCache();
  return payout;
}

async function listAdminPayouts(provider, query = {}) {
  const version = await cache.getVersion("admin-transactions");
  const cacheKey = buildAdminTransactionsCacheKey(provider, query, version);

  return cache.getOrSet(cacheKey, ADMIN_TRANSACTIONS_TTL_SECONDS, () =>
    fetchAdminPayoutsFromDb(provider, query),
  );
}

module.exports = {
  recordAdminPayout,
  updateAdminPayout,
  listAdminPayouts,
  invalidateAdminTransactionsCache,
  mapPayoutInput,
  extractExternalMeta,
};
