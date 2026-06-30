const { prisma } = require("../../../config/db.config");
const { emitToUser } = require("../../../config/socket.config");
const { errors } = require("../../../shared/errors/app.error");
const { sendEmail: sendEmailRaw } = require("../../../services/email.service");
const { sendSms } = require("../../../services/sms.service");

const VALID_TYPES = [
  "SYSTEM",
  "ORDER",
  "PAYMENT",
  "DELIVERY",
  "KYC",
  "ACCOUNT",
  "PROMOTION",
];

const DEFAULT_NOTIFICATION_SETTINGS = {
  SYSTEM: { inApp: true, email: true, sms: false, push: true },
  ORDER: { inApp: true, email: true, sms: false, push: true },
  PAYMENT: { inApp: true, email: true, sms: true, push: true },
  DELIVERY: { inApp: true, email: false, sms: false, push: true },
  KYC: { inApp: true, email: true, sms: false, push: false },
  ACCOUNT: { inApp: true, email: true, sms: false, push: true },
  PROMOTION: { inApp: true, email: false, sms: false, push: false },
};

// ─── Resolve channels ─────────────────────────────────────────────────────────

const resolveChannels = (prefs, type) => {
  const globalToggles = {
    inApp: prefs?.notifyInApp ?? true,
    email: prefs?.notifyEmail ?? true,
    sms: prefs?.notifySms ?? false,
    push: prefs?.notifyPush ?? true,
  };

  const typeDefaults =
    DEFAULT_NOTIFICATION_SETTINGS[type] ?? DEFAULT_NOTIFICATION_SETTINGS.SYSTEM;
  const userTypeSettings = prefs?.notificationSettings?.[type] ?? {};
  const typeSettings = { ...typeDefaults, ...userTypeSettings };

  return {
    inApp: globalToggles.inApp && typeSettings.inApp,
    email: globalToggles.email && typeSettings.email,
    sms: globalToggles.sms && typeSettings.sms,
    push: globalToggles.push && typeSettings.push,
  };
};

// ─── Email helper ─────────────────────────────────────────────────────────────

const sendNotificationEmail = ({ to, name, subject, body }) => {
  return sendEmailRaw({
    to,
    subject,
    data: {
      title: subject,
      name,
      message: body,
      whyText:
        "Vous recevez cet e-mail car vous avez activé les notifications SwiftGoma.",
    },
  });
};

// ─── Core send ────────────────────────────────────────────────────────────────

const send = async ({
  userId,
  type,
  title,
  body,
  data = null,
  emailSubject,
  emailBody,
  smsBody,
}) => {
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`Type de notification invalide : ${type}`);
  }

  const [prefs, user] = await Promise.all([
    prisma.userPreferences.findUnique({
      where: { userId },
      select: {
        notifyInApp: true,
        notifyEmail: true,
        notifySms: true,
        notifyPush: true,
        notificationSettings: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, name: true },
    }),
  ]);

  if (!user) return null;

  const channels = resolveChannels(prefs, type);
  let notification = null;

  // ── InApp: persist + emit via socket ────────────────────────────────────

  if (channels.inApp) {
    notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data ?? undefined,
      },
    });

    emitToUser(userId, "notification:new", notification);
  }

  // ── Push: emit via socket for online users (provider TBD for offline) ───

  if (channels.push && !channels.inApp) {
    emitToUser(userId, "notification:new", {
      type,
      title,
      body,
      data,
      createdAt: new Date().toISOString(),
    });
  }

  // ── Email ────────────────────────────────────────────────────────────────

  if (channels.email && user.email) {
    sendNotificationEmail({
      to: user.email,
      name: user.name,
      subject: emailSubject ?? title,
      body: emailBody ?? body,
    }).catch((err) =>
      console.error(`📧 Notification email error [${type}]:`, err.message),
    );
  }

  // ── SMS ──────────────────────────────────────────────────────────────────

  if (channels.sms && user.phone) {
    const message = smsBody ?? `SwiftGoma: ${title}. ${body}`;
    sendSms({ to: user.phone, message }).catch((err) =>
      console.error(`📱 Notification SMS error [${type}]:`, err.message),
    );
  }

  return notification;
};

// ─── Bulk send ────────────────────────────────────────────────────────────────

const sendToMany = async ({ userIds, type, title, body, data = null }) => {
  await Promise.allSettled(
    userIds.map((userId) => send({ userId, type, title, body, data })),
  );
};

// ─── List ─────────────────────────────────────────────────────────────────────

const listNotifications = async ({
  userId,
  page = 1,
  limit = 20,
  unreadOnly = false,
  type,
}) => {
  const skip = (page - 1) * limit;
  const where = {
    userId,
    ...(unreadOnly && { isRead: false }),
    ...(type && { type }),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Unread count ─────────────────────────────────────────────────────────────

const getUnreadCount = async ({ userId }) => {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { count };
};

// ─── Mark as read ─────────────────────────────────────────────────────────────

const markAsRead = async ({ userId, notificationId }) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== userId) {
    throw errors.badRequest("Notification introuvable.");
  }
  if (notification.isRead) return notification;
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
};

const markAllAsRead = async ({ userId }) => {
  const { count } = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { updated: count };
};

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteNotification = async ({ userId, notificationId }) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== userId) {
    throw errors.badRequest("Notification introuvable.");
  }
  await prisma.notification.delete({ where: { id: notificationId } });
  return true;
};

const deleteAllNotifications = async ({ userId }) => {
  const { count } = await prisma.notification.deleteMany({ where: { userId } });
  return { deleted: count };
};

module.exports = {
  send,
  sendToMany,
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  DEFAULT_NOTIFICATION_SETTINGS,
};
