const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError } = require("../../../common/errors");

const prisma = getPrismaClient();

function serializeDecimal(value) {
  return value?.toString?.() ?? value;
}

function serializePayment(payment) {
  if (!payment) return payment;
  return {
    ...payment,
    amount: serializeDecimal(payment.amount),
  };
}

function serializeSubscription(subscription) {
  if (!subscription) return subscription;
  return {
    ...subscription,
    payments: (subscription.payments || []).map(serializePayment),
  };
}

async function listAdminSubscriptions(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {};
  if (query.status) where.status = query.status;

  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    where.OR = [
      { sellerProfile: { businessName: { contains: search, mode: "insensitive" } } },
      { sellerProfile: { user: { name: { contains: search, mode: "insensitive" } } } },
      { sellerProfile: { user: { email: { contains: search, mode: "insensitive" } } } },
      { plan: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, subscriptions] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        plan: { select: { id: true, name: true, slug: true } },
        sellerProfile: {
          select: {
            id: true,
            businessName: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { payments: true } },
      },
    }),
  ]);

  return {
    items: subscriptions,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function getAdminSubscriptionById(subscriptionId) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: { include: { prices: true } },
      sellerProfile: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        include: {
          plan: { select: { name: true, slug: true } },
          invoices: {
            select: { id: true, type: true, documentNumber: true, pdfUrl: true },
          },
        },
      },
    },
  });

  if (!subscription) {
    throw new NotFoundError("Abonnement introuvable.");
  }

  return serializeSubscription(subscription);
}

module.exports = {
  listAdminSubscriptions,
  getAdminSubscriptionById,
};
