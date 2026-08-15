const { getPrismaClient } = require("../../../config/prisma");
const { env } = require("../../../config/env");
const QRCode = require("qrcode");
const { NotFoundError, ConflictError } = require("../../../common/errors");
const {
  generateQrToken,
  assertValidFulfillmentInput,
  assertValidStatusTransition,
  assertCancellable,
  calculateOrderTotals,
  assertValidCheckoutCurrency,
} = require("../utils/order.utils");
const { ORDER_CONFIG } = require("../config/order.config");
const { getCart, clearCart } = require("./cart.service");
const {
  initiatePayin,
  initiatePayout,
  checkTransactionStatus,
} = require("../../payments/services/mbioyopay.service");
const {
  createNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");
const {
  orderStatusEmail,
} = require("../../../common/emails/templates/orderStatus");
const { emitToUser, emitToOrder } = require("../../../config/socket");
const { convertAmount } = require("../../product/utils/exchangeRate.utils");
const {
  findRiderForSellerAssignment,
  activateRider,
} = require("../../seller/services/rider.service");
const {
  generateOrderInvoiceAndReceipt,
} = require("../../invoicing/services/invoice.service");
const { createQueue } = require("../../../config/queue");
const { QUEUE_NAMES } = require("../../../common/constants/queueNames");

const prisma = getPrismaClient();

const TERMINAL_ORDER_STATUSES = [
  "CANCELLED",
  "EXPIRED",
  "FAILED",
  "REJECTED",
  "COMPLETED",
];

function formatMoney(amount, currency) {
  const num = Number(amount);
  const formatted =
    currency === "CDF"
      ? Math.round(num)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      : num.toFixed(2);
  return `${formatted} ${currency}`;
}

async function getShopOrThrow(shopId) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { sellerProfile: { include: { user: true } } },
  });
  if (!shop || shop.deletedAt || shop.status !== "PUBLISHED") {
    throw new NotFoundError("Boutique introuvable.");
  }
  return shop;
}

async function getFullOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payment: true,
      shop: { include: { sellerProfile: { include: { user: true } } } },
      buyer: true,
      rider: { include: { user: true } },
    },
  });
  if (!order) throw new NotFoundError("Commande introuvable.");
  return order;
}

async function assertOrderOwnedByShop(orderId, sellerProfileId) {
  const order = await getFullOrder(orderId);
  if (order.shop.sellerProfileId !== sellerProfileId) {
    throw new NotFoundError("Commande introuvable.");
  }
  return order;
}

async function assertOrderOwnedByBuyer(orderId, buyerId) {
  const order = await getFullOrder(orderId);
  if (order.buyerId !== buyerId) {
    throw new NotFoundError("Commande introuvable.");
  }
  return order;
}

async function assertOrderAssignedToRider(orderId, riderUserId) {
  const order = await getFullOrder(orderId);
  if (!order.rider || order.rider.userId !== riderUserId) {
    throw new NotFoundError("Commande introuvable.");
  }
  return order;
}

async function assertCanViewOrder(orderId, userId) {
  const order = await getFullOrder(orderId);
  const isBuyer = order.buyerId === userId;
  const isSeller = order.shop.sellerProfile.userId === userId;
  const isRider = order.rider && order.rider.userId === userId;

  if (!isBuyer && !isSeller && !isRider) {
    throw new NotFoundError("Commande introuvable.");
  }
  return order;
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
    console.error("[order] Failed to emit socket update:", err.message);
  }
}

async function notifyBuyerWithEmail(order, { action, title, body, reason }) {
  try {
    const emailContent = orderStatusEmail({
      name: order.buyer.name,
      action,
      shopName: order.shop.name,
      reason,
      actionUrl: `${env.appUrl}/orders/${order.id}`,
      locale: "fr",
    });

    await createNotification({
      userId: order.buyerId,
      type: NOTIFICATION_TYPES.ORDER_STATUS,
      title: emailContent.subject,
      body,
      data: { action, orderId: order.id },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error(`[order] Failed to notify buyer (${action}):`, err.message);
  }
}

async function notifySellerWithEmail(shop, order, { action, title, body }) {
  try {
    const emailContent = orderStatusEmail({
      name: shop.sellerProfile.businessName,
      action,
      amount: formatMoney(order.total, order.currency),
      actionUrl: `${env.appUrl}/seller/orders/${order.id}`,
      locale: "fr",
    });

    await createNotification({
      userId: shop.sellerProfile.user.id,
      type: NOTIFICATION_TYPES.ORDER_STATUS,
      title: emailContent.subject,
      body,
      data: { action, orderId: order.id },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error(`[order] Failed to notify seller (${action}):`, err.message);
  }
}

async function notifyRiderWithEmail(rider, order, { action, title, body }) {
  try {
    const emailContent = orderStatusEmail({
      name: rider.user.name,
      action,
      amount: formatMoney(order.total, order.currency),
      actionUrl: `${env.appUrl}/rider/deliveries/${order.id}`,
      locale: "fr",
    });

    await createNotification({
      userId: rider.userId,
      type: NOTIFICATION_TYPES.ORDER_STATUS,
      title: emailContent.subject,
      body,
      data: { action, orderId: order.id },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error(`[order] Failed to notify rider (${action}):`, err.message);
  }
}

async function notifyBuyer(buyerId, { title, body, action, orderId }) {
  try {
    await createNotification({
      userId: buyerId,
      type: NOTIFICATION_TYPES.ORDER_STATUS,
      title,
      body,
      data: { action, orderId },
    });
  } catch (err) {
    console.error(`[order] Failed to notify buyer (${action}):`, err.message);
  }
}

async function notifyRider(riderUserId, { title, body, action, orderId }) {
  try {
    await createNotification({
      userId: riderUserId,
      type: NOTIFICATION_TYPES.ORDER_STATUS,
      title,
      body,
      data: { action, orderId },
    });
  } catch (err) {
    console.error(`[order] Failed to notify rider (${action}):`, err.message);
  }
}

async function sendOrderPaymentDocuments(orderPaymentId, orderId) {
  const payment = await prisma.orderPayment.findUnique({
    where: { id: orderPaymentId },
  });
  if (!payment) {
    console.warn(
      `[order] Skipping stale invoice job — payment ${orderPaymentId} not found (order ${orderId}).`,
    );
    return;
  }

  let invoiceRecord = null;
  let invoiceBuffer = null;
  let receiptRecord = null;
  let receiptBuffer = null;

  try {
    const { invoice, receipt } =
      await generateOrderInvoiceAndReceipt(orderPaymentId);
    invoiceRecord = invoice.record;
    invoiceBuffer = invoice.pdfBuffer;
    receiptRecord = receipt.record;
    receiptBuffer = receipt.pdfBuffer;
  } catch (err) {
    console.error(
      `[order] Failed to generate invoice/receipt for order ${orderId}:`,
      err.message,
    );
    throw err;
  }

  const attachments = [
    ...(invoiceBuffer && invoiceRecord
      ? [
          {
            filename: `${invoiceRecord.documentNumber}.pdf`,
            content: invoiceBuffer,
            contentType: "application/pdf",
          },
        ]
      : []),
    ...(receiptBuffer && receiptRecord
      ? [
          {
            filename: `${receiptRecord.documentNumber}.pdf`,
            content: receiptBuffer,
            contentType: "application/pdf",
          },
        ]
      : []),
  ];

  try {
    const fullOrder = await getFullOrder(orderId);
    const emailContent = orderStatusEmail({
      name: fullOrder.buyer.name,
      action: "orderCompleted",
      shopName: fullOrder.shop.name,
      actionUrl: `${env.appUrl}/orders/${fullOrder.id}`,
      locale: "fr",
    });

    await createNotification({
      userId: fullOrder.buyerId,
      type: NOTIFICATION_TYPES.PAYMENT,
      title: emailContent.subject,
      body: `Votre commande chez ${fullOrder.shop.name} a été payée. Facture et reçu ci-joints.`,
      data: { action: "orderPaymentConfirmed", orderId: fullOrder.id },
      emailOverride: {
        ...emailContent,
        attachments: attachments.length ? attachments : undefined,
      },
    });
  } catch (err) {
    console.error(
      `[order] Failed to send invoice/receipt email for order ${orderId}:`,
      err.message,
    );
    throw err;
  }
}

async function checkout({
  buyerId,
  shopId,
  paymentMethod,
  fulfillmentMethod,
  deliveryAddress,
  deliveryLatitude,
  deliveryLongitude,
  payerPhoneNumber,
  network,
  countryCode,
  currency: requestedCurrency,
}) {
  const shop = await getShopOrThrow(shopId);

  assertValidFulfillmentInput(
    fulfillmentMethod,
    deliveryAddress,
    deliveryLatitude,
    deliveryLongitude,
  );

  const cart = await getCart(buyerId, shopId, requestedCurrency);
  if (!cart.id || cart.items.length === 0) {
    throw new ConflictError("Le panier est vide.");
  }

  for (const item of cart.items) {
    if (item.conversionUnavailable) {
      throw new ConflictError(
        `Conversion de devise indisponible pour « ${item.variant.product.name} ». Choisissez une autre devise ou contactez le support.`,
      );
    }
  }

  const pendingOrder = await prisma.order.findFirst({
    where: {
      buyerId,
      shopId,
      status: { in: ["AWAITING_PAYMENT", "PENDING_SELLER_REVIEW"] },
    },
    select: { id: true },
  });
  if (pendingOrder) {
    throw new ConflictError(
      "Une commande est déjà en cours pour cette boutique. Merci d'attendre sa confirmation avant de réessayer.",
    );
  }

  for (const item of cart.items) {
    if (item.variant.stock < item.quantity) {
      throw new ConflictError(
        `Stock insuffisant pour "${item.variant.product.name}". Disponible : ${item.variant.stock}.`,
      );
    }
    if (item.variant.product.status !== "PUBLISHED") {
      throw new ConflictError(
        `Le produit "${item.variant.product.name}" n'est plus disponible.`,
      );
    }
  }

  const currency =
    requestedCurrency || cart.cartCurrency || shop.deliveryFeeCurrency;
  assertValidCheckoutCurrency(currency);

  const resolvedItems = await Promise.all(
    cart.items.map(async (item) => {
      const itemCurrency = item.variant.product.currency;
      const rawPrice = Number(item.variant.price);
      const unitPrice =
        itemCurrency === currency
          ? rawPrice
          : await convertAmount(rawPrice, itemCurrency, currency);

      return {
        productId: item.variant.product.id,
        variantId: item.variant.id,
        productName: item.variant.product.name,
        variantName: item.variant.name,
        unitPrice,
        quantity: item.quantity,
        subtotal: unitPrice * item.quantity,
      };
    }),
  );

  const rawDeliveryFee =
    fulfillmentMethod === "DELIVERY" ? Number(shop.deliveryFee) : 0;
  const deliveryFee =
    fulfillmentMethod === "DELIVERY" && shop.deliveryFeeCurrency !== currency
      ? await convertAmount(rawDeliveryFee, shop.deliveryFeeCurrency, currency)
      : rawDeliveryFee;

  const { subtotal, total } = calculateOrderTotals(resolvedItems, deliveryFee);

  const initialStatus =
    paymentMethod === "ONLINE_PAYMENT"
      ? "AWAITING_PAYMENT"
      : "PENDING_SELLER_REVIEW";

  const order = await prisma.order.create({
    data: {
      buyerId,
      shopId,
      paymentMethod,
      fulfillmentMethod,
      status: initialStatus,
      currency,
      subtotal,
      deliveryFee,
      total,
      deliveryAddress:
        fulfillmentMethod === "DELIVERY" ? deliveryAddress : null,
      deliveryLatitude:
        fulfillmentMethod === "DELIVERY" ? deliveryLatitude : null,
      deliveryLongitude:
        fulfillmentMethod === "DELIVERY" ? deliveryLongitude : null,
      qrToken: generateQrToken(),
      items: { create: resolvedItems },
    },
    include: { items: true },
  });

  if (paymentMethod === "CASH_ON_DELIVERY") {
    await clearCart(buyerId, shopId);
    const fullOrder = await getFullOrder(order.id);
    await notifySellerWithEmail(shop, fullOrder, {
      action: "newOrderReceived",
      title: "Nouvelle commande reçue",
      body: `Vous avez reçu une nouvelle commande de ${formatMoney(total, currency)}.`,
    });
    return { order };
  }

  const payinOrderId = `SWG-ORD-${order.id}`;

  const payment = await prisma.orderPayment.create({
    data: {
      orderId: order.id,
      amount: total,
      currency,
      network,
      phoneNumber: payerPhoneNumber,
      countryCode,
      status: "PENDING",
      payinOrderId,
    },
  });

  try {
    const payin = await initiatePayin({
      amount: total,
      currency,
      network,
      phoneNumber: payerPhoneNumber,
      countryCode,
      orderId: payinOrderId,
    });

    const updatedPayment = await prisma.orderPayment.update({
      where: { id: payment.id },
      data: {
        payinTransactionId: payin.transaction_id,
      },
    });

    return { order, payment: updatedPayment, payin };
  } catch (err) {
    await prisma.orderPayment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: err.message },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "FAILED", failureReason: err.message },
    });
    throw err;
  }
}

async function findPaymentForCallback({ transactionId, orderId }) {
  let payment = await prisma.orderPayment.findUnique({
    where: { payinTransactionId: transactionId },
    include: {
      order: {
        include: {
          shop: { include: { sellerProfile: { include: { user: true } } } },
          buyer: true,
        },
      },
    },
  });

  if (!payment && orderId) {
    payment = await prisma.orderPayment.findUnique({
      where: { payinOrderId: orderId },
      include: {
        order: {
          include: {
            shop: { include: { sellerProfile: { include: { user: true } } } },
            buyer: true,
          },
        },
      },
    });

    if (payment && !payment.payinTransactionId) {
      payment = await prisma.orderPayment.update({
        where: { id: payment.id },
        data: { payinTransactionId: transactionId },
        include: {
          order: {
            include: {
              shop: {
                include: { sellerProfile: { include: { user: true } } },
              },
              buyer: true,
            },
          },
        },
      });
    }
  }

  return payment;
}

async function findRefundPaymentForCallback({ transactionId, orderId }) {
  let payment = await prisma.orderPayment.findFirst({
    where: { payoutTransactionId: transactionId },
    include: { order: { include: { buyer: true } } },
  });

  if (!payment && orderId) {
    payment = await prisma.orderPayment.findFirst({
      where: { payoutOrderId: orderId },
      include: { order: { include: { buyer: true } } },
    });

    if (payment && !payment.payoutTransactionId) {
      payment = await prisma.orderPayment.update({
        where: { id: payment.id },
        data: { payoutTransactionId: transactionId },
        include: { order: { include: { buyer: true } } },
      });
    }
  }

  return payment;
}

async function confirmOrderRefund(transactionId, orderId) {
  const payment = await findRefundPaymentForCallback({
    transactionId,
    orderId,
  });
  if (!payment) {
    throw new NotFoundError("Remboursement de commande introuvable.");
  }

  if (payment.status === "REFUNDED" && payment.payoutTransactionId) {
    return { payment };
  }

  await prisma.orderPayment.update({
    where: { id: payment.id },
    data: {
      status: "REFUNDED",
      payoutTransactionId: transactionId,
      refundedAt: payment.refundedAt ?? new Date(),
      failureReason: null,
    },
  });

  return { payment };
}

async function failOrderRefund(transactionId, failureReason, orderId) {
  const payment = await findRefundPaymentForCallback({
    transactionId,
    orderId,
  });
  if (!payment) {
    throw new NotFoundError("Remboursement de commande introuvable.");
  }

  const claimed = await prisma.orderPayment.updateMany({
    where: { id: payment.id, status: "REFUNDED" },
    data: {
      status: "SUCCEEDED",
      refundedAt: null,
      payoutOrderId: null,
      payoutTransactionId: null,
      failureReason: failureReason || "Refund payout failed",
    },
  });

  if (claimed.count === 1) {
    console.error(
      `[order] Refund payout failed for order ${payment.orderId}: ${failureReason}`,
    );
  }

  return { payment };
}

async function confirmOrderPayment(transactionId, orderId) {
  const payment = await findPaymentForCallback({ transactionId, orderId });
  if (!payment) throw new NotFoundError("Paiement de commande introuvable.");
  if (payment.status === "SUCCEEDED") {
    return { payment, order: payment.order };
  }

  const txResult = await prisma.$transaction(async (tx) => {
    const claimed = await tx.orderPayment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "SUCCEEDED", heldAt: new Date() },
    });
    if (claimed.count !== 1) {
      return { type: "lost_race" };
    }

    const currentOrder = await tx.order.findUnique({
      where: { id: payment.orderId },
    });

    if (TERMINAL_ORDER_STATUSES.includes(currentOrder.status)) {
      return { type: "terminal", order: currentOrder };
    }

    if (currentOrder.status !== "AWAITING_PAYMENT") {
      return { type: "skip_transition", order: currentOrder };
    }

    const orderClaimed = await tx.order.updateMany({
      where: { id: payment.orderId, status: "AWAITING_PAYMENT" },
      data: { status: "PENDING_SELLER_REVIEW" },
    });
    if (orderClaimed.count !== 1) {
      return { type: "skip_transition", order: currentOrder };
    }

    const updatedOrder = await tx.order.findUnique({
      where: { id: payment.orderId },
    });
    return { type: "success", order: updatedOrder };
  });

  if (txResult.type === "lost_race") {
    const current = await prisma.orderPayment.findUnique({
      where: { id: payment.id },
      include: { order: true },
    });
    return { payment: current, order: current?.order ?? payment.order };
  }

  const updatedPayment = await prisma.orderPayment.findUnique({
    where: { id: payment.id },
  });

  if (txResult.type === "terminal") {
    console.error(
      `[order] Payment confirmed for order ${payment.orderId} but order already in terminal state "${txResult.order.status}" — refunding.`,
    );
    await refundOrderPayment(
      { ...txResult.order, payment: updatedPayment },
      "late_payment_confirmation",
    );
    return { payment: updatedPayment, order: txResult.order };
  }

  if (txResult.type === "skip_transition") {
    console.error(
      `[order] Payment confirmed for order ${payment.orderId} but order status is "${txResult.order.status}" (expected AWAITING_PAYMENT) — skipping transition.`,
    );
    return { payment: updatedPayment, order: txResult.order };
  }

  const updatedOrder = txResult.order;
  emitOrderUpdate(updatedOrder);

  await clearCart(payment.order.buyerId, payment.order.shopId);

  try {
    await createQueue(QUEUE_NAMES.INVOICES).add("order-payment-documents", {
      orderPaymentId: updatedPayment.id,
      orderId: updatedOrder.id,
    });
  } catch (err) {
    console.error(
      `[order] Failed to enqueue invoice/receipt job for order ${updatedOrder.id}:`,
      err.message,
    );
  }

  await notifySellerWithEmail(
    payment.order.shop,
    await getFullOrder(updatedOrder.id),
    {
      action: "newOrderReceived",
      title: "Nouvelle commande reçue",
      body: `Vous avez reçu une nouvelle commande de ${formatMoney(payment.amount, payment.currency)}.`,
    },
  );

  return { payment: updatedPayment, order: updatedOrder };
}

async function failOrderPayment(transactionId, failureReason, orderId) {
  const payment = await findPaymentForCallback({ transactionId, orderId });
  if (!payment) throw new NotFoundError("Paiement de commande introuvable.");
  if (payment.status === "FAILED") {
    return { payment, order: payment.order };
  }

  const txResult = await prisma.$transaction(async (tx) => {
    const claimed = await tx.orderPayment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "FAILED", failureReason },
    });
    if (claimed.count !== 1) {
      return { type: "lost_race" };
    }

    const currentOrder = await tx.order.findUnique({
      where: { id: payment.orderId },
    });

    if (
      TERMINAL_ORDER_STATUSES.includes(currentOrder.status) ||
      currentOrder.status !== "AWAITING_PAYMENT"
    ) {
      return { type: "skip_transition", order: currentOrder };
    }

    const orderClaimed = await tx.order.updateMany({
      where: { id: payment.orderId, status: "AWAITING_PAYMENT" },
      data: { status: "FAILED", failureReason },
    });
    if (orderClaimed.count !== 1) {
      return { type: "skip_transition", order: currentOrder };
    }

    const updatedOrder = await tx.order.findUnique({
      where: { id: payment.orderId },
    });
    return { type: "success", order: updatedOrder };
  });

  if (txResult.type === "lost_race") {
    const current = await prisma.orderPayment.findUnique({
      where: { id: payment.id },
      include: { order: true },
    });
    return { payment: current, order: current?.order ?? payment.order };
  }

  const updatedPayment = await prisma.orderPayment.findUnique({
    where: { id: payment.id },
  });

  if (txResult.type === "skip_transition") {
    console.error(
      `[order] Payment failed for order ${payment.orderId} but order status is already "${txResult.order.status}" — skipping transition.`,
    );
    return { payment: updatedPayment, order: txResult.order };
  }

  const updatedOrder = txResult.order;
  emitOrderUpdate(updatedOrder);

  const fullOrder = await getFullOrder(updatedOrder.id);
  await notifyBuyerWithEmail(fullOrder, {
    action: "paymentFailed",
    title: "Échec du paiement de votre commande",
    body: "Le paiement de votre commande a échoué. Merci de réessayer.",
  });

  return { payment: updatedPayment, order: updatedOrder };
}

async function reconcileOnePendingOrderPayment(payment) {
  const reference = payment.payinTransactionId || payment.payinOrderId;
  if (!reference) {
    console.error(
      `[order] Pending order payment ${payment.id} has no payinTransactionId/payinOrderId to reconcile — skipping.`,
    );
    return null;
  }

  let status;
  try {
    const result = await checkTransactionStatus(reference);
    status = result?.status;
  } catch (err) {
    console.error(
      `[order] Reconciliation status check failed for order payment ${payment.id} (${reference}):`,
      err.message,
    );
    return null;
  }

  if (status === "successful") {
    return confirmOrderPayment(
      payment.payinTransactionId,
      payment.payinOrderId,
    );
  }
  if (status === "failed") {
    return failOrderPayment(
      payment.payinTransactionId,
      "MbiyoPay payin failed (reconciled via status poll)",
      payment.payinOrderId,
    );
  }

  return null;
}

async function reconcilePendingOrderPayments() {
  const threshold = new Date(
    Date.now() -
      ORDER_CONFIG.PENDING_PAYMENT_RECONCILE_AFTER_MINUTES * 60 * 1000,
  );

  const stalePayments = await prisma.orderPayment.findMany({
    where: {
      status: "PENDING",
      createdAt: { lte: threshold },
      order: { status: "AWAITING_PAYMENT" },
    },
  });

  const results = await Promise.allSettled(
    stalePayments.map((payment) => reconcileOnePendingOrderPayment(payment)),
  );

  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}

async function acceptOrder(orderId, sellerProfileId) {
  const order = await assertOrderOwnedByShop(orderId, sellerProfileId);
  assertValidStatusTransition(
    order.status,
    "ACCEPTED",
    order.fulfillmentMethod,
  );

  const updated = await prisma.$transaction(async (tx) => {
    await claimOrderStatus(tx, orderId, "PENDING_SELLER_REVIEW", {
      status: "ACCEPTED",
      acceptedAt: new Date(),
    });

    for (const item of order.items) {
      const decremented = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (decremented.count !== 1) {
        throw new ConflictError(
          `Stock insuffisant pour "${item.productName}" — impossible d'accepter cette commande.`,
        );
      }

      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stock: true },
      });
      const stockAfter = variant.stock;
      const stockBefore = stockAfter + item.quantity;

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          type: "SALE",
          amount: -item.quantity,
          reason: `Commande ${orderId} acceptée`,
          stockBefore,
          stockAfter,
        },
      });
    }

    return tx.order.findUnique({ where: { id: orderId } });
  });
  emitOrderUpdate(updated);

  const fullOrder = await getFullOrder(orderId);
  await notifyBuyerWithEmail(fullOrder, {
    action: "orderAccepted",
    title: "Votre commande a été acceptée",
    body: "Le vendeur prépare votre commande.",
  });

  return fullOrder;
}

async function refundOrderPayment(order, reasonLabel) {
  if (order.paymentMethod !== "ONLINE_PAYMENT" || !order.payment) {
    return;
  }

  const claimed = await prisma.orderPayment.updateMany({
    where: { id: order.payment.id, status: "SUCCEEDED" },
    data: { status: "REFUNDED", refundedAt: new Date() },
  });
  if (claimed.count !== 1) {
    return;
  }

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
    console.error(
      `[order] Refund failed on ${reasonLabel} for order ${order.id}:`,
      err.message,
    );
  }
}

async function rejectOrder(orderId, sellerProfileId, reason) {
  const order = await assertOrderOwnedByShop(orderId, sellerProfileId);
  assertValidStatusTransition(
    order.status,
    "REJECTED",
    order.fulfillmentMethod,
  );

  const updated = await prisma.$transaction(async (tx) => {
    await claimOrderStatus(tx, orderId, order.status, {
      status: "REJECTED",
      rejectionReason: reason || null,
      rejectedAt: new Date(),
    });
    return tx.order.findUnique({ where: { id: orderId } });
  });
  emitOrderUpdate(updated);

  await refundOrderPayment(order, "rejection");

  const fullOrder = await getFullOrder(orderId);
  await notifyBuyerWithEmail(fullOrder, {
    action: "orderRejected",
    title: "Votre commande a été refusée",
    body: reason
      ? `Le vendeur a refusé votre commande. Raison : ${reason}`
      : "Le vendeur a refusé votre commande.",
    reason,
  });

  return updated;
}

async function markReadyForPickup(orderId, sellerProfileId) {
  const order = await assertOrderOwnedByShop(orderId, sellerProfileId);
  assertValidStatusTransition(
    order.status,
    "READY_FOR_PICKUP",
    order.fulfillmentMethod,
  );

  await claimOrderStatus(prisma, orderId, order.status, {
    status: "READY_FOR_PICKUP",
  });
  const updated = await prisma.order.findUnique({ where: { id: orderId } });
  emitOrderUpdate(updated);

  await notifyBuyer(order.buyerId, {
    title: "Votre commande est prête",
    body: "Votre commande vous attend en boutique.",
    action: "orderReadyForPickup",
    orderId,
  });

  return updated;
}

async function markReadyForDelivery(orderId, sellerProfileId) {
  const order = await assertOrderOwnedByShop(orderId, sellerProfileId);

  if (order.status === "PREPARING") {
    return order;
  }

  assertValidStatusTransition(
    order.status,
    "PREPARING",
    order.fulfillmentMethod,
  );

  await claimOrderStatus(prisma, orderId, order.status, {
    status: "PREPARING",
  });
  const updated = await prisma.order.findUnique({ where: { id: orderId } });
  emitOrderUpdate(updated);

  await notifyBuyer(order.buyerId, {
    title: "Commande en préparation",
    body: "Le vendeur prépare votre commande pour la livraison.",
    action: "orderPreparing",
    orderId,
  });

  return updated;
}

async function markOrderReady(orderId, sellerProfileId) {
  const order = await assertOrderOwnedByShop(orderId, sellerProfileId);

  if (order.fulfillmentMethod === "PICKUP") {
    return markReadyForPickup(orderId, sellerProfileId);
  }

  return markReadyForDelivery(orderId, sellerProfileId);
}

async function completePickupHandoff(orderId, sellerProfileId, scannedQrToken) {
  const order = await assertOrderOwnedByShop(orderId, sellerProfileId);
  assertValidStatusTransition(
    order.status,
    "COMPLETED",
    order.fulfillmentMethod,
  );

  if (order.qrToken !== scannedQrToken) {
    throw new ConflictError("Code QR invalide.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: order.status, qrScannedAt: null },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        qrScannedAt: new Date(),
      },
    });
    if (claimed.count !== 1) {
      throw new ConflictError("Ce QR a déjà été scanné.");
    }

    if (order.paymentMethod === "ONLINE_PAYMENT") {
      await creditSellerWallet(tx, order);
    }

    return tx.order.findUnique({ where: { id: orderId } });
  });
  emitOrderUpdate(updated);

  const fullOrder = await getFullOrder(orderId);
  await notifyBuyerWithEmail(fullOrder, {
    action: "orderCompleted",
    title: "Commande récupérée",
    body: "Merci pour votre achat !",
  });

  return updated;
}

async function assignRider(orderId, sellerProfileId, riderIdOrUserId) {
  const order = await assertOrderOwnedByShop(orderId, sellerProfileId);
  assertValidStatusTransition(
    order.status,
    "RIDER_ASSIGNED",
    order.fulfillmentMethod,
  );

  let rider = await findRiderForSellerAssignment(
    sellerProfileId,
    riderIdOrUserId,
  );

  if (rider.status === "SUSPENDED") {
    throw new ConflictError(
      "Ce livreur est suspendu et ne peut pas recevoir de livraison.",
    );
  }

  if (rider.status === "PENDING" || !rider.isAvailable) {
    rider = await activateRider(rider.id, sellerProfileId);
  }

  await claimOrderStatus(prisma, orderId, order.status, {
    status: "RIDER_ASSIGNED",
    riderId: rider.id,
  });
  const updated = await prisma.order.findUnique({ where: { id: orderId } });
  emitOrderUpdate(updated);

  const fullOrder = await getFullOrder(orderId);
  await notifyRiderWithEmail(rider, fullOrder, {
    action: "deliveryAssigned",
    title: "Nouvelle livraison assignée",
    body: `Une commande de ${formatMoney(order.total, order.currency)} vous a été assignée.`,
  });
  await notifyBuyer(order.buyerId, {
    title: "Un livreur a été assigné",
    body: "Votre commande sera bientôt en route.",
    action: "riderAssigned",
    orderId,
  });

  return updated;
}

async function markPickedUp(orderId, riderUserId) {
  const order = await assertOrderAssignedToRider(orderId, riderUserId);
  assertValidStatusTransition(
    order.status,
    "PICKED_UP",
    order.fulfillmentMethod,
  );

  await claimOrderStatus(prisma, orderId, order.status, {
    status: "PICKED_UP",
    pickedUpAt: new Date(),
  });
  const updated = await prisma.order.findUnique({ where: { id: orderId } });
  emitOrderUpdate(updated);

  await notifyBuyer(order.buyerId, {
    title: "Votre commande a été récupérée",
    body: "Le livreur est en route vers vous.",
    action: "orderPickedUp",
    orderId,
  });

  return updated;
}

async function markOnTheWay(orderId, riderUserId) {
  const order = await assertOrderAssignedToRider(orderId, riderUserId);
  assertValidStatusTransition(
    order.status,
    "ON_THE_WAY",
    order.fulfillmentMethod,
  );

  await claimOrderStatus(prisma, orderId, order.status, {
    status: "ON_THE_WAY",
  });
  const updated = await prisma.order.findUnique({ where: { id: orderId } });
  emitOrderUpdate(updated);

  await notifyBuyer(order.buyerId, {
    title: "Votre commande est en route",
    body: "Le livreur se dirige vers vous.",
    action: "orderOnTheWay",
    orderId,
  });

  return updated;
}

async function completeDeliveryHandoff(orderId, riderUserId, scannedQrToken) {
  const order = await assertOrderAssignedToRider(orderId, riderUserId);
  assertValidStatusTransition(
    order.status,
    "DELIVERED",
    order.fulfillmentMethod,
  );

  if (order.qrToken !== scannedQrToken) {
    throw new ConflictError("Code QR invalide.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: order.status, qrScannedAt: null },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        qrScannedAt: new Date(),
      },
    });
    if (claimed.count !== 1) {
      throw new ConflictError("Ce QR a déjà été scanné.");
    }

    if (order.paymentMethod === "ONLINE_PAYMENT") {
      await creditSellerWallet(tx, order);
    }

    return tx.order.findUnique({ where: { id: orderId } });
  });
  emitOrderUpdate(updated);

  const fullOrder = await getFullOrder(orderId);
  await notifyBuyerWithEmail(fullOrder, {
    action: "orderCompleted",
    title: "Commande livrée",
    body: "Merci pour votre achat !",
  });

  return updated;
}

async function markFailedDelivery(orderId, riderUserId, reason) {
  const order = await assertOrderAssignedToRider(orderId, riderUserId);
  assertValidStatusTransition(order.status, "FAILED", order.fulfillmentMethod);

  await claimOrderStatus(prisma, orderId, order.status, {
    status: "FAILED",
    failureReason: reason || null,
  });
  const updated = await prisma.order.findUnique({ where: { id: orderId } });
  emitOrderUpdate(updated);

  await refundOrderPayment(order, "delivery_failed");

  await notifyBuyer(order.buyerId, {
    title: "Échec de la livraison",
    body: reason
      ? `La livraison a échoué. Raison : ${reason}`
      : "La livraison a échoué.",
    action: "deliveryFailed",
    orderId,
  });

  return updated;
}

async function scanOrderQr(scannerUserId, scannedQrToken) {
  const order = await prisma.order.findUnique({
    where: { qrToken: scannedQrToken },
    include: { shop: true, rider: true },
  });
  if (!order) throw new NotFoundError("Code QR invalide.");

  if (order.fulfillmentMethod === "PICKUP") {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: scannerUserId },
    });
    if (!sellerProfile || order.shop.sellerProfileId !== sellerProfile.id) {
      throw new NotFoundError("Commande introuvable.");
    }
    return completePickupHandoff(order.id, sellerProfile.id, scannedQrToken);
  }

  if (order.fulfillmentMethod === "DELIVERY") {
    if (!order.rider || order.rider.userId !== scannerUserId) {
      throw new NotFoundError("Commande introuvable.");
    }
    return completeDeliveryHandoff(order.id, scannerUserId, scannedQrToken);
  }

  throw new ConflictError("Mode de fulfillment inconnu pour cette commande.");
}

async function getOrderQrCode(orderId, requesterId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, qrToken: true, qrScannedAt: true },
  });
  if (!order || order.buyerId !== requesterId) {
    throw new NotFoundError("Commande introuvable.");
  }
  if (order.qrScannedAt) {
    throw new ConflictError("Ce QR a déjà été utilisé.");
  }

  const qrCodeDataUrl = await QRCode.toDataURL(order.qrToken);
  return { qrCodeDataUrl };
}

async function creditSellerWallet(tx, order) {
  if (!order.payment) return;

  const claimed = await tx.orderPayment.updateMany({
    where: { id: order.payment.id, status: "SUCCEEDED" },
    data: { status: "RELEASED", releasedAt: new Date() },
  });
  if (claimed.count !== 1) return;

  const sellerProfileId = order.shop.sellerProfileId;
  const amount = Number(order.payment.amount);
  const currency = order.payment.currency;

  let wallet = await tx.wallet.findUnique({ where: { sellerProfileId } });
  if (!wallet) {
    wallet = await tx.wallet.create({ data: { sellerProfileId } });
  }

  let walletBalance = await tx.walletBalance.findUnique({
    where: { walletId_currency: { walletId: wallet.id, currency } },
  });
  if (!walletBalance) {
    walletBalance = await tx.walletBalance.create({
      data: { walletId: wallet.id, currency, balance: 0 },
    });
  }

  const updatedBalance = await tx.walletBalance.update({
    where: { id: walletBalance.id },
    data: { balance: { increment: amount } },
  });
  const balanceAfter = Number(updatedBalance.balance);
  const balanceBefore = balanceAfter - amount;

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      walletBalanceId: walletBalance.id,
      type: "ORDER_CREDIT",
      status: "COMPLETED",
      amount,
      currency,
      reason: `Commande ${order.id} livrée/récupérée`,
      balanceBefore,
      balanceAfter,
      orderId: order.id,
    },
  });
}

async function cancelOrder(orderId, buyerId, reason) {
  const order = await assertOrderOwnedByBuyer(orderId, buyerId);
  assertCancellable(order.status);

  const updated = await prisma.$transaction(async (tx) => {
    await claimOrderStatus(tx, orderId, order.status, {
      status: "CANCELLED",
      cancelReason: reason || null,
      cancelledAt: new Date(),
    });
    return tx.order.findUnique({ where: { id: orderId } });
  });
  emitOrderUpdate(updated);

  await refundOrderPayment(order, "cancellation");

  try {
    await createNotification({
      userId: order.shop.sellerProfile.user.id,
      type: NOTIFICATION_TYPES.ORDER_STATUS,
      title: "Commande annulée",
      body: "Une commande a été annulée par l'acheteur.",
      data: { action: "orderCancelled", orderId },
    });
  } catch (err) {
    console.error(
      "[order] Failed to notify seller of cancellation:",
      err.message,
    );
  }

  return getFullOrder(orderId);
}

async function expireUnansweredOrders() {
  const threshold = new Date();
  threshold.setMinutes(
    threshold.getMinutes() - ORDER_CONFIG.SELLER_REVIEW_TIMEOUT_MINUTES,
  );

  const staleOrders = await prisma.order.findMany({
    where: {
      status: "PENDING_SELLER_REVIEW",
      createdAt: { lte: threshold },
    },
    include: {
      payment: true,
      buyer: true,
      shop: { include: { sellerProfile: { include: { user: true } } } },
    },
  });

  const results = await Promise.allSettled(
    staleOrders.map((order) => expireOneOrder(order)),
  );

  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}

async function expireOneOrder(order) {
  assertValidStatusTransition(order.status, "EXPIRED", order.fulfillmentMethod);

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      await claimOrderStatus(tx, order.id, order.status, {
        status: "EXPIRED",
        failureReason: "Aucune réponse du vendeur dans le délai imparti.",
      });
      return tx.order.findUnique({ where: { id: order.id } });
    });
  } catch (err) {
    console.warn(
      `[order] Skipped auto-expiry for order ${order.id} — status changed concurrently:`,
      err.message,
    );
    return false;
  }

  emitOrderUpdate(updated);

  await refundOrderPayment(order, "seller_timeout");

  const fullOrder = await getFullOrder(order.id);
  await Promise.all([
    notifyBuyerWithEmail(fullOrder, {
      action: "orderExpired",
      title: "Commande expirée",
      body: "Le vendeur n'a pas répondu à temps. Votre paiement a été remboursé.",
    }),
    notifySellerWithEmail(order.shop, fullOrder, {
      action: "orderExpiredSeller",
      title: "Commande expirée",
      body: "Une commande a expiré automatiquement faute de réponse de votre part.",
    }),
  ]);

  return true;
}

async function completeStaleDeliveredOrders() {
  const threshold = new Date();
  threshold.setHours(
    threshold.getHours() - ORDER_CONFIG.DELIVERED_AUTO_COMPLETE_HOURS,
  );

  const staleOrders = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      fulfillmentMethod: "DELIVERY",
      deliveredAt: { lte: threshold },
    },
  });

  const results = await Promise.allSettled(
    staleOrders.map((order) => completeOneDeliveredOrder(order)),
  );

  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}

async function completeOneDeliveredOrder(order, { notifySeller = false } = {}) {
  assertValidStatusTransition(
    order.status,
    "COMPLETED",
    order.fulfillmentMethod,
  );

  let updated;

  try {
    updated = await prisma.$transaction(async (tx) => {
      await claimOrderStatus(tx, order.id, order.status, {
        status: "COMPLETED",
        completedAt: new Date(),
      });
      return tx.order.findUnique({ where: { id: order.id } });
    });
  } catch (err) {
    console.warn(
      `[order] Skipped auto-complete for order ${order.id} — status changed concurrently:`,
      err.message,
    );
    return false;
  }

  emitOrderUpdate(updated);

  if (notifySeller) {
    try {
      const sellerUserId = order.shop?.sellerProfile?.userId;
      if (sellerUserId) {
        await createNotification({
          userId: sellerUserId,
          type: NOTIFICATION_TYPES.ORDER_STATUS,
          title: "Réception confirmée",
          body: "Le client a confirmé la réception de sa commande.",
          data: { action: "orderReceiptConfirmed", orderId: order.id },
        });
      }
    } catch (err) {
      console.error(
        `[order] Failed to notify seller of receipt confirmation for order ${order.id}:`,
        err.message,
      );
    }
  }

  return true;
}

async function getOrderById(orderId, requesterId) {
  return assertCanViewOrder(orderId, requesterId);
}

async function listOrdersForBuyer(
  buyerId,
  { page = 1, limit = 20, status } = {},
) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const where = { buyerId, ...(status ? { status } : {}) };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: { items: true, shop: { select: { name: true, slug: true } } },
    }),
  ]);

  return {
    orders,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

async function listOrdersForShop(
  shopId,
  sellerProfileId,
  { page = 1, limit = 20, status } = {},
) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop || shop.sellerProfileId !== sellerProfileId) {
    throw new NotFoundError("Boutique introuvable.");
  }

  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const where = { shopId, ...(status ? { status } : {}) };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: { items: true, buyer: { select: { id: true, name: true } } },
    }),
  ]);

  return {
    orders,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

async function listOrdersForRider(
  riderUserId,
  { page = 1, limit = 20, status } = {},
) {
  const rider = await prisma.rider.findUnique({
    where: { userId: riderUserId },
  });
  if (!rider) throw new NotFoundError("Profil livreur introuvable.");

  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const where = { riderId: rider.id, ...(status ? { status } : {}) };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        shop: { select: { name: true } },
        buyer: { select: { name: true } },
      },
    }),
  ]);

  return {
    orders,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

async function expireStuckOnTheWayOrders() {
  const threshold = new Date();
  threshold.setMinutes(
    threshold.getMinutes() - ORDER_CONFIG.ON_THE_WAY_TIMEOUT_MINUTES,
  );

  const staleOrders = await prisma.order.findMany({
    where: {
      status: "ON_THE_WAY",
      fulfillmentMethod: "DELIVERY",
      updatedAt: { lte: threshold },
    },
    include: {
      payment: true,
      buyer: true,
      shop: { include: { sellerProfile: { include: { user: true } } } },
    },
  });

  const results = await Promise.allSettled(
    staleOrders.map((order) => failOneStuckOnTheWayOrder(order)),
  );

  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}

async function failOneStuckOnTheWayOrder(order) {
  assertValidStatusTransition(order.status, "FAILED", order.fulfillmentMethod);

  const failureReason =
    "Livraison non finalisée dans le délai imparti (délai dépassé en route).";

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      await claimOrderStatus(tx, order.id, order.status, {
        status: "FAILED",
        failureReason,
      });
      return tx.order.findUnique({ where: { id: order.id } });
    });
  } catch (err) {
    console.warn(
      `[order] Skipped auto-fail for order ${order.id} — status changed concurrently:`,
      err.message,
    );
    return false;
  }

  emitOrderUpdate(updated);
  await refundOrderPayment(order, "delivery_timeout");

  await notifyBuyer(order.buyerId, {
    title: "Échec de la livraison",
    body: "La livraison n'a pas pu être finalisée à temps. Votre paiement sera remboursé.",
    action: "deliveryFailed",
    orderId: order.id,
  });

  return true;
}

async function unassignStaleRiderOrders() {
  const threshold = new Date();
  threshold.setMinutes(
    threshold.getMinutes() - ORDER_CONFIG.RIDER_ASSIGNED_TIMEOUT_MINUTES,
  );

  const staleOrders = await prisma.order.findMany({
    where: {
      status: "RIDER_ASSIGNED",
      fulfillmentMethod: "DELIVERY",
      updatedAt: { lte: threshold },
    },
    include: {
      buyer: true,
      shop: { include: { sellerProfile: { include: { user: true } } } },
      rider: { include: { user: true } },
    },
  });

  const results = await Promise.allSettled(
    staleOrders.map((order) => unassignOneStaleRiderOrder(order)),
  );

  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}

async function unassignOneStaleRiderOrder(order) {
  assertValidStatusTransition(
    order.status,
    "ACCEPTED",
    order.fulfillmentMethod,
  );
  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      await claimOrderStatus(tx, order.id, order.status, {
        status: "ACCEPTED",
        riderId: null,
      });
      return tx.order.findUnique({ where: { id: order.id } });
    });
  } catch (err) {
    console.warn(
      `[order] Skipped rider unassign for order ${order.id} — status changed concurrently:`,
      err.message,
    );
    return false;
  }
  emitOrderUpdate(updated);
  try {
    const sellerUserId = order.shop?.sellerProfile?.userId;
    if (sellerUserId) {
      await createNotification({
        userId: sellerUserId,
        type: NOTIFICATION_TYPES.ORDER_STATUS,
        title: "Livreur non disponible",
        body: "Le livreur n'a pas récupéré la commande à temps. Veuillez en assigner un autre.",
        data: { action: "riderUnassigned", orderId: order.id },
      });
    }
    await createNotification({
      userId: order.buyerId,
      type: NOTIFICATION_TYPES.ORDER_STATUS,
      title: "Changement de livreur",
      body: "Votre commande est réassignée — un nouveau livreur sera bientôt désigné.",
      data: { action: "riderUnassigned", orderId: order.id },
    });
  } catch (err) {
    console.error(
      `[order] Failed to notify after rider unassign for order ${order.id}:`,
      err.message,
    );
  }
  return true;
}

async function wasDeliveryReminderSent(userId, orderId, action) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type: NOTIFICATION_TYPES.ORDER_STATUS,
      AND: [
        { data: { path: ["action"], equals: action } },
        { data: { path: ["orderId"], equals: orderId } },
      ],
    },
    select: { id: true },
  });
  return Boolean(existing);
}

async function sendDeliveryReminder(userId, orderId, action, title, body) {
  if (await wasDeliveryReminderSent(userId, orderId, action)) {
    return false;
  }

  await createNotification({
    userId,
    type: NOTIFICATION_TYPES.ORDER_STATUS,
    title,
    body,
    data: { action, orderId },
  });

  return true;
}

async function remindStaleDeliveryOrders() {
  let sent = 0;

  const riderAssignedThreshold = new Date();
  riderAssignedThreshold.setMinutes(
    riderAssignedThreshold.getMinutes() -
      ORDER_CONFIG.RIDER_ASSIGNED_REMINDER_MINUTES,
  );
  const riderAssignedTimeoutThreshold = new Date();
  riderAssignedTimeoutThreshold.setMinutes(
    riderAssignedTimeoutThreshold.getMinutes() -
      ORDER_CONFIG.RIDER_ASSIGNED_TIMEOUT_MINUTES,
  );

  const riderAssignedOrders = await prisma.order.findMany({
    where: {
      status: "RIDER_ASSIGNED",
      fulfillmentMethod: "DELIVERY",
      updatedAt: {
        lte: riderAssignedThreshold,
        gt: riderAssignedTimeoutThreshold,
      },
    },
    include: {
      buyer: true,
      rider: { include: { user: true } },
      shop: { include: { sellerProfile: { include: { user: true } } } },
    },
  });

  for (const order of riderAssignedOrders) {
    if (order.rider?.userId) {
      if (
        await sendDeliveryReminder(
          order.rider.userId,
          order.id,
          "deliveryReminderRiderAssignedRider",
          "Récupération en attente",
          "Une commande vous est assignée — merci de la récupérer chez le vendeur.",
        )
      ) {
        sent += 1;
      }
    }
    if (
      order.shop?.sellerProfile?.userId &&
      (await sendDeliveryReminder(
        order.shop.sellerProfile.userId,
        order.id,
        "deliveryReminderRiderAssignedSeller",
        "Livreur en retard",
        "Le livreur n'a pas encore récupéré la commande.",
      ))
    ) {
      sent += 1;
    }
  }

  const pickedUpThreshold = new Date();
  pickedUpThreshold.setMinutes(
    pickedUpThreshold.getMinutes() - ORDER_CONFIG.PICKED_UP_REMINDER_MINUTES,
  );

  const pickedUpOrders = await prisma.order.findMany({
    where: {
      status: "PICKED_UP",
      fulfillmentMethod: "DELIVERY",
      updatedAt: { lte: pickedUpThreshold },
    },
    include: { rider: { include: { user: true } } },
  });

  for (const order of pickedUpOrders) {
    if (!order.rider?.userId) continue;
    if (
      await sendDeliveryReminder(
        order.rider.userId,
        order.id,
        "deliveryReminderPickedUp",
        "Marquez la commande en route",
        "Le colis est récupéré — passez le statut à « en route ».",
      )
    ) {
      sent += 1;
    }
  }

  const onTheWayThreshold = new Date();
  onTheWayThreshold.setMinutes(
    onTheWayThreshold.getMinutes() - ORDER_CONFIG.ON_THE_WAY_REMINDER_MINUTES,
  );
  const onTheWayTimeoutThreshold = new Date();
  onTheWayTimeoutThreshold.setMinutes(
    onTheWayTimeoutThreshold.getMinutes() -
      ORDER_CONFIG.ON_THE_WAY_TIMEOUT_MINUTES,
  );

  const onTheWayOrders = await prisma.order.findMany({
    where: {
      status: "ON_THE_WAY",
      fulfillmentMethod: "DELIVERY",
      updatedAt: {
        lte: onTheWayThreshold,
        gt: onTheWayTimeoutThreshold,
      },
    },
    include: {
      buyer: true,
      rider: { include: { user: true } },
    },
  });

  for (const order of onTheWayOrders) {
    if (order.rider?.userId) {
      if (
        await sendDeliveryReminder(
          order.rider.userId,
          order.id,
          "deliveryReminderOnTheWayRider",
          "Livraison en cours",
          "Finalisez la livraison ou signalez un problème si l'acheteur est injoignable.",
        )
      ) {
        sent += 1;
      }
    }
    if (
      await sendDeliveryReminder(
        order.buyerId,
        order.id,
        "deliveryReminderOnTheWayBuyer",
        "Livraison en route",
        "Votre commande est en route — préparez votre code QR pour la remise.",
      )
    ) {
      sent += 1;
    }
  }

  return sent;
}

async function confirmDeliveryReceipt(orderId, buyerId) {
  const order = await assertOrderOwnedByBuyer(orderId, buyerId);

  if (order.status !== "DELIVERED") {
    throw new ConflictError(
      "Cette commande ne peut être confirmée que lorsqu'elle est au statut « livrée ».",
    );
  }

  const completed = await completeOneDeliveredOrder(order, {
    notifySeller: true,
  });
  if (!completed) {
    throw new ConflictError(
      "La commande a changé de statut entre-temps. Veuillez rafraîchir et réessayer.",
    );
  }

  return prisma.order.findUnique({ where: { id: orderId } });
}

module.exports = {
  checkout,
  confirmOrderPayment,
  failOrderPayment,
  confirmOrderRefund,
  failOrderRefund,
  acceptOrder,
  rejectOrder,
  markReadyForPickup,
  markReadyForDelivery,
  markOrderReady,
  remindStaleDeliveryOrders,
  completePickupHandoff,
  assignRider,
  expireStuckOnTheWayOrders,
  markPickedUp,
  markOnTheWay,
  completeDeliveryHandoff,
  markFailedDelivery,
  scanOrderQr,
  getOrderQrCode,
  cancelOrder,
  expireUnansweredOrders,
  reconcilePendingOrderPayments,
  getOrderById,
  listOrdersForBuyer,
  listOrdersForShop,
  listOrdersForRider,
  emitOrderUpdate,
  sendOrderPaymentDocuments,
  completeStaleDeliveredOrders,
  confirmDeliveryReceipt,
  assertCanViewOrder,
  unassignStaleRiderOrders,
};
