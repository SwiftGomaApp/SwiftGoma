const { getPrismaClient } = require("../../../config/prisma");
const {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ValidationError,
} = require("../../../common/errors");
const { assertCancellable } = require("../utils/order.utils");
const { initiatePayout } = require("../../payments/services/mbioyopay.service");
const {
  createNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");
const { emitToUser, emitToOrder } = require("../../../config/socket");

const prisma = getPrismaClient();

const ORDER_INCLUDE = {
  items: true,
  payment: true,
  shop: { include: { sellerProfile: { include: { user: true } } } },
  buyer: true,
  rider: { include: { user: true } },
};

function serializeDecimal(value) {
  return value?.toString?.() ?? value;
}

function serializeOrder(order) {
  if (!order) return order;
  return {
    ...order,
    subtotal: serializeDecimal(order.subtotal),
    deliveryFee: serializeDecimal(order.deliveryFee),
    total: serializeDecimal(order.total),
    cashCollected: serializeDecimal(order.cashCollected),
    payment: order.payment
      ? {
          ...order.payment,
          amount: serializeDecimal(order.payment.amount),
        }
      : null,
    items: (order.items || []).map((item) => ({
      ...item,
      unitPrice: serializeDecimal(item.unitPrice),
      subtotal: serializeDecimal(item.subtotal),
    })),
  };
}

async function getFullOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE,
  });
  if (!order) throw new NotFoundError("Commande introuvable.");
  return order;
}

function emitOrderUpdate(order) {
  try {
    emitToOrder(order.id, "order:status", {
      orderId: order.id,
      status: order.status,
      updatedAt: order.updatedAt || new Date(),
    });
    emitToUser(order.buyerId, "order:status", {
      orderId: order.id,
      status: order.status,
    });
  } catch (err) {
    console.error("[admin-order] Socket emit failed:", err.message);
  }
}

async function claimOrderStatus(tx, orderId, fromStatus, data) {
  const claimed = await tx.order.updateMany({
    where: { id: orderId, status: fromStatus },
    data,
  });
  if (claimed.count !== 1) {
    throw new ConflictError(
      "Cette commande a déjà changé d'état entre-temps — action impossible.",
    );
  }
}

async function refundOrderPayment(order, reasonLabel) {
  if (order.paymentMethod !== "ONLINE_PAYMENT" || !order.payment) return;

  const claimed = await prisma.orderPayment.updateMany({
    where: { id: order.payment.id, status: "SUCCEEDED" },
    data: { status: "REFUNDED", refundedAt: new Date() },
  });
  if (claimed.count !== 1) return;

  try {
    const refund = await initiatePayout({
      amount: order.payment.amount,
      currency: order.payment.currency,
      network: order.payment.network,
      phoneNumber: order.payment.phoneNumber,
      countryCode: order.payment.countryCode,
      beneficiary: `${order.buyer.name} (remboursement)`,
      orderId: `SWG-REFUND-${order.id}`,
    });

    await prisma.orderPayment.update({
      where: { id: order.payment.id },
      data: {
        payoutOrderId: refund.orderId,
        payoutTransactionId: refund.transaction_id,
      },
    });
  } catch (err) {
    await prisma.orderPayment
      .update({
        where: { id: order.payment.id },
        data: {
          status: "SUCCEEDED",
          refundedAt: null,
          failureReason: `Échec du remboursement (${reasonLabel}): ${err.message}`,
        },
      })
      .catch(() => {});
    throw new BadRequestError(`Le remboursement a échoué : ${err.message}`);
  }
}

async function listAdminOrders(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {};
  if (query.status) where.status = query.status;
  if (query.shopId) where.shopId = String(query.shopId);
  if (query.buyerId) where.buyerId = String(query.buyerId);

  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { buyer: { name: { contains: search, mode: "insensitive" } } },
      { shop: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        payment: true,
        shop: { select: { id: true, name: true, slug: true } },
        buyer: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    items: orders.map(serializeOrder),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function getAdminOrderById(orderId) {
  return serializeOrder(await getFullOrder(orderId));
}

async function adminCancelOrder(orderId, actor, reason) {
  const order = await getFullOrder(orderId);
  assertCancellable(order.status);

  const staffReason = reason?.trim()
    ? `[${actor.role}] ${actor.name}: ${reason.trim()}`
    : `[${actor.role}] Annulée par ${actor.name}`;

  const updated = await prisma.$transaction(async (tx) => {
    await claimOrderStatus(tx, orderId, order.status, {
      status: "CANCELLED",
      cancelReason: staffReason,
      cancelledAt: new Date(),
    });
    return tx.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });
  });

  emitOrderUpdate(updated);
  if (actor.role === "ADMIN") {
    await refundOrderPayment(order, "admin_cancellation");
  }

  try {
    await createNotification({
      userId: order.buyerId,
      type: NOTIFICATION_TYPES.ORDER_STATUS,
      title: "Votre commande a été annulée",
      body: "Notre équipe a annulé cette commande. Si un paiement avait été effectué, vous serez remboursé sous peu.",
      data: { action: "orderCancelled", orderId },
    });
    await createNotification({
      userId: order.shop.sellerProfile.userId,
      type: NOTIFICATION_TYPES.ORDER_STATUS,
      title: "Une commande a été annulée par notre équipe",
      body: "Cette commande a été annulée par l'équipe SwiftGoma. Aucune action n'est requise de votre part.",
      data: { action: "orderCancelled", orderId },
    });
  } catch (err) {
    console.error("[admin-order] Notification failed:", err.message);
  }

  return serializeOrder(await getFullOrder(orderId));
}

async function adminRefundOrder(orderId) {
  throw new ValidationError(
    "Les remboursements directs sont désactivés. Utilisez POST /orders/admin/:id/refund/request-approval puis POST /orders/admin/:id/refund/confirm avec le code OTP.",
  );
}

module.exports = {
  listAdminOrders,
  getAdminOrderById,
  adminCancelOrder,
  adminRefundOrder,
};
