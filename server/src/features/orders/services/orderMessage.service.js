const { getPrismaClient } = require("../../../config/prisma");
const { getRedisClient } = require("../../../config/redis");
const {
  ValidationError,
  ForbiddenError,
  TooManyRequestsError,
} = require("../../../common/errors");
const { ORDER_CONFIG } = require("../config/order.config");
const { assertCanViewOrder } = require("./order.service");
const {
  createNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");

const prisma = getPrismaClient();

const MESSAGE_PREVIEW_LENGTH = 80;

function chatRateLimitKey(userId) {
  return `chat:rl:${userId}`;
}

async function assertNotRateLimited(userId) {
  const redis = getRedisClient();
  if (!redis) return;

  const key = chatRateLimitKey(userId);

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(
      key,
      ORDER_CONFIG.CHAT_MESSAGE_RATE_LIMIT_WINDOW_SECONDS,
    );
  }
  if (count > ORDER_CONFIG.CHAT_MESSAGE_RATE_LIMIT_MAX) {
    throw new TooManyRequestsError(
      "Trop de messages envoyés. Veuillez ralentir.",
    );
  }
}

async function assertChatOpen(orderId, userId) {
  const order = await assertCanViewOrder(orderId, userId);

  const isBuyer = order.buyerId === userId;
  const isRider = order.rider && order.rider.userId === userId;

  if (!isBuyer && !isRider) {
    throw new ForbiddenError("Vous n'avez pas accès à cette conversation.");
  }

  if (
    !order.rider ||
    !ORDER_CONFIG.CHAT_ACTIVE_STATUSES.includes(order.status)
  ) {
    throw new ForbiddenError(
      "La conversation n'est disponible que pendant la livraison.",
    );
  }

  return {
    order,
    role: isBuyer ? "BUYER" : "RIDER",
    recipientId: isBuyer ? order.rider.userId : order.buyerId,
  };
}

function formatMessage(message) {
  return {
    id: message.id,
    orderId: message.orderId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    body: message.body,
    readAt: message.readAt,
    createdAt: message.createdAt,
  };
}

async function sendOrderMessage({ orderId, senderId, body }) {
  const trimmed = typeof body === "string" ? body.trim() : "";

  if (!trimmed) {
    throw new ValidationError("Le message ne peux pas etre vide");
  }

  if (trimmed.length > ORDER_CONFIG.CHAT_MESSAGE_MAX_LENGTH) {
    throw new ValidationError(
      `Le message dépasse la limite de ${ORDER_CONFIG.CHAT_MESSAGE_MAX_LENGTH} caractères.`,
    );
  }

  const { order, role, recipientId } = await assertChatOpen(orderId, senderId);

  await assertNotRateLimited(senderId);

  const message = await prisma.orderMessage.create({
    data: {
      orderId,
      senderId,
      senderRole: role,
      body: trimmed,
    },
  });

  const senderName =
    role === "BUYER" ? order.buyer.name : order.rider.user.name;

  const preview =
    trimmed.length > MESSAGE_PREVIEW_LENGTH
      ? `${trimmed.slice(0, MESSAGE_PREVIEW_LENGTH)}…`
      : trimmed;

  try {
    await createNotification({
      userId: recipientId,
      type: NOTIFICATION_TYPES.ORDER_MESSAGE,
      title: `Message de ${senderName}`,
      body: preview,
      data: { orderId, messageId: message.id },
    });
  } catch (err) {
    console.error("[orderMessage] Failed to notify recipient:", err.message);
  }

  return formatMessage(message);
}

async function listOrderMessages(orderId, userId, query = {}) {
  await assertCanViewOrder(orderId, userId);

  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
  const cursor = typeof query.before === "string" ? query.before : undefined;

  const messages = await prisma.orderMessage.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  return messages.reverse().map(formatMessage);
}

async function markOrderMessagesRead(orderId, userId) {
  const order = await assertCanViewOrder(orderId, userId);

  await prisma.orderMessage.updateMany({
    where: { orderId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });

  return { orderId, readBy: userId, order };
}

module.exports = {
  assertChatOpen,
  sendOrderMessage,
  listOrderMessages,
  markOrderMessagesRead,
  formatMessage,
};
