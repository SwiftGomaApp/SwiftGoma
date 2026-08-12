const { getPrismaClient } = require("../../../config/prisma");

const prisma = getPrismaClient();

function serializeDecimal(value) {
  return value?.toString?.() ?? value;
}

function normalizeEntry(entry) {
  return {
    ...entry,
    amount: serializeDecimal(entry.amount),
  };
}

function expensesEnabled() {
  return Boolean(prisma.expense);
}

async function fetchAdminPayoutEntries(where, take) {
  const rows = await prisma.adminPayout.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
    include: { admin: { select: { id: true, name: true } } },
  });

  return rows.map((row) =>
    normalizeEntry({
      id: row.id,
      source: "ADMIN_PAYOUT",
      direction: "OUT",
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      reference: row.externalId || row.id,
      label: row.beneficiary || "Paiement sortant admin",
      provider: row.provider,
      createdAt: row.createdAt,
      meta: {
        adminName: row.admin?.name,
        phoneNumber: row.phoneNumber,
        network: row.network,
      },
    }),
  );
}

async function fetchSubscriptionPaymentEntries(where, take) {
  const rows = await prisma.subscriptionPayment.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      subscription: {
        include: {
          sellerProfile: { select: { businessName: true } },
        },
      },
      plan: { select: { name: true } },
    },
  });

  return rows.map((row) =>
    normalizeEntry({
      id: row.id,
      source: "SUBSCRIPTION_PAYMENT",
      direction: "IN",
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      reference: row.depositId || row.id,
      label: row.subscription?.sellerProfile?.businessName || "Abonnement",
      provider: row.provider,
      createdAt: row.createdAt,
      meta: {
        planName: row.plan?.name,
        payerPhoneNumber: row.payerPhoneNumber,
      },
    }),
  );
}

async function fetchOrderPaymentEntries(where, take) {
  const rows = await prisma.orderPayment.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          buyer: { select: { name: true } },
        },
      },
    },
  });

  return rows.map((row) =>
    normalizeEntry({
      id: row.id,
      source: "ORDER_PAYMENT",
      direction: "IN",
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      reference: row.payinOrderId || row.payinTransactionId || row.orderId,
      label: row.order?.buyer?.name
        ? `Commande · ${row.order.buyer.name}`
        : "Commande",
      provider: row.provider,
      createdAt: row.createdAt,
      meta: {
        orderId: row.orderId,
        network: row.network,
        phoneNumber: row.phoneNumber,
      },
    }),
  );
}

async function fetchExpenseEntries(where, take) {
  if (!expensesEnabled()) return [];

  const rows = await prisma.expense.findMany({
    where,
    take,
    orderBy: { incurredAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
    },
  });

  return rows.map((row) =>
    normalizeEntry({
      id: row.id,
      source: "EXPENSE",
      direction: "OUT",
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      reference: row.reference,
      label: row.title,
      provider: row.providerName,
      createdAt: row.incurredAt,
      meta: {
        category: row.category,
        vendorName: row.vendorName,
        createdByName: row.createdBy?.name,
      },
    }),
  );
}

function buildSearchFilter(search, fields) {
  if (!search) return undefined;
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
    })),
  };
}

async function countSource(source, where) {
  switch (source) {
    case "ADMIN_PAYOUT":
      return prisma.adminPayout.count({ where });
    case "SUBSCRIPTION_PAYMENT":
      return prisma.subscriptionPayment.count({ where });
    case "ORDER_PAYMENT":
      return prisma.orderPayment.count({ where });
    case "EXPENSE":
      return expensesEnabled() ? prisma.expense.count({ where }) : 0;
    default:
      return 0;
  }
}

async function fetchSourceEntries(source, where, take) {
  switch (source) {
    case "ADMIN_PAYOUT":
      return fetchAdminPayoutEntries(where, take);
    case "SUBSCRIPTION_PAYMENT":
      return fetchSubscriptionPaymentEntries(where, take);
    case "ORDER_PAYMENT":
      return fetchOrderPaymentEntries(where, take);
    case "EXPENSE":
      return fetchExpenseEntries(where, take);
    default:
      return [];
  }
}

function buildWhereForSource(source, { status, search }) {
  switch (source) {
    case "ADMIN_PAYOUT":
      return {
        ...(status ? { status } : {}),
        ...(search
          ? buildSearchFilter(search, [
              "beneficiary",
              "externalId",
              "phoneNumber",
            ])
          : {}),
      };
    case "SUBSCRIPTION_PAYMENT":
      return {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { depositId: { contains: search, mode: "insensitive" } },
                {
                  subscription: {
                    sellerProfile: {
                      businessName: { contains: search, mode: "insensitive" },
                    },
                  },
                },
              ],
            }
          : {}),
      };
    case "ORDER_PAYMENT":
      return {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { payinOrderId: { contains: search, mode: "insensitive" } },
                { payinTransactionId: { contains: search, mode: "insensitive" } },
                { orderId: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      };
    case "EXPENSE":
      return {
        ...(status ? { status } : {}),
        ...(search
          ? buildSearchFilter(search, ["reference", "title", "vendorName"])
          : {}),
      };
    default:
      return {};
  }
}

const ALL_SOURCES = [
  "ADMIN_PAYOUT",
  "SUBSCRIPTION_PAYMENT",
  "ORDER_PAYMENT",
  "EXPENSE",
];

async function listPaymentLedger(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  const fetchTake = skip + limit;

  const sourceFilter = query.source?.trim() || "";
  const directionFilter = query.direction?.trim() || "";
  const status = query.status?.trim() || "";
  const search = typeof query.search === "string" ? query.search.trim() : "";

  let sources = ALL_SOURCES;
  if (sourceFilter && ALL_SOURCES.includes(sourceFilter)) {
    sources = [sourceFilter];
  }

  if (directionFilter === "IN") {
    sources = sources.filter((s) =>
      ["SUBSCRIPTION_PAYMENT", "ORDER_PAYMENT"].includes(s),
    );
  } else if (directionFilter === "OUT") {
    sources = sources.filter((s) => ["ADMIN_PAYOUT", "EXPENSE"].includes(s));
  }

  const wheres = sources.map((source) =>
    buildWhereForSource(source, { status, search }),
  );

  const [counts, entryGroups] = await Promise.all([
    Promise.all(sources.map((source, i) => countSource(source, wheres[i]))),
    Promise.all(
      sources.map((source, i) => fetchSourceEntries(source, wheres[i], fetchTake)),
    ),
  ]);

  const merged = entryGroups
    .flat()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const items = merged.slice(skip, skip + limit);
  const total = counts.reduce((sum, n) => sum + n, 0);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

module.exports = {
  listPaymentLedger,
};
