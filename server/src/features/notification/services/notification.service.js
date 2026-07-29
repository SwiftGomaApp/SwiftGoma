const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError, BadRequestError } = require("../../../common/errors");
const { sendMail } = require("../../../config/mailer");
const { sendSms } = require("../../../config/sms");
const { sendPushNotification } = require("../../../config/oneSignal");
const { emitToUser } = require("../../../config/socket");
const { renderEmailLayout } = require("../../../common/emails/layout");
const { BRAND } = require("../../../common/constants/brand");
const {
  resolveChannels,
  channelsToArray,
} = require("../utils/notificationChannels");
const { buildNotificationPayload } = require("../utils/notificationPayload");
const { NOTIFICATION_CONFIG } = require("../config/notification.config");

const prisma = getPrismaClient();

function parsePagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(
      parseInt(query.limit, 10) || NOTIFICATION_CONFIG.DEFAULT_LIST_LIMIT,
      1,
    ),
    NOTIFICATION_CONFIG.MAX_LIST_LIMIT,
  );
  return { page, limit, skip: (page - 1) * limit };
}

function buildGenericEmail({ title, body, locale = "fr" }) {
  const bodyHtml = `<p style="margin: 0;">${body}</p>`;

  const html = renderEmailLayout({
    preheader: title,
    heading: title,
    bodyHtml,
    cta: null,
    reason: `Vous recevez cet e-mail car vous êtes inscrit sur ${BRAND.name}.`,
    locale,
  });

  return { subject: `${BRAND.name} - ${title}`, html };
}

async function deliverToChannels({
  user,
  notification,
  channels,
  emailOverride,
}) {
  const payload = buildNotificationPayload(notification);

  if (channels.inApp) {
    try {
      emitToUser(user.id, "notification:new", payload);
    } catch (err) {
      console.error("[notification] Failed to emit socket event:", err.message);
    }
  }

  if (channels.push) {
    try {
      await sendPushNotification({
        externalUserIds: [user.id],
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
      });
    } catch (err) {
      console.error("[notification] Failed to send push:", err.message);
    }
  }

  if (channels.email && user.email) {
    try {
      const { subject, html } =
        emailOverride ||
        buildGenericEmail({
          title: notification.title,
          body: notification.body,
        });
      const attachments = emailOverride?.attachments;
      await sendMail({ to: user.email, subject, html, attachments });
    } catch (err) {
      console.error("[notification] Failed to send email:", err.message);
    }
  }

  if (channels.sms && user.phone) {
    try {
      await sendSms({
        to: user.phone,
        message: `${notification.title}: ${notification.body}`.slice(0, 160),
      });
    } catch (err) {
      console.error("[notification] Failed to send SMS:", err.message);
    }
  }
}

async function createNotification({
  userId,
  type,
  title,
  body,
  data,
  emailOverride,
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: { where: { isPrimary: true }, take: 1 } },
  });
  if (!user) throw new NotFoundError("User not found.");

  const channels = await resolveChannels(userId, type);

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      data: data || undefined,
      channels: channelsToArray(channels),
      isRead: false,
    },
  });

  const email = user.emails[0]?.email ?? null;
  await deliverToChannels({
    user: { id: user.id, email, phone: user.phone },
    notification,
    channels,
    emailOverride,
  });

  return buildNotificationPayload(notification);
}

async function listNotifications(userId, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const { unreadOnly, type } = query;

  const where = {
    userId,
    ...(unreadOnly === "true" ? { isRead: false } : {}),
    ...(type ? { type } : {}),
  };

  const [total, unreadCount, notifications] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    notifications: notifications.map(buildNotificationPayload),
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function markAsRead(userId, notificationId) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new NotFoundError("Notification not found.");
  if (notification.isRead) {
    return buildNotificationPayload(notification);
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });

  return buildNotificationPayload(updated);
}

async function markAllAsRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return { updatedCount: result.count };
}

async function deleteNotification(userId, notificationId) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new NotFoundError("Notification not found.");

  await prisma.notification.delete({ where: { id: notificationId } });
  return { id: notificationId, deleted: true };
}

async function getPreferences(userId) {
  return prisma.notificationPreference.findMany({ where: { userId } });
}

async function updatePreference({ userId, type, inApp, email, sms, push }) {
  if (!type) throw new BadRequestError("Notification type is required.");

  const updated = await prisma.notificationPreference.upsert({
    where: { userId_type: { userId, type } },
    update: {
      ...(inApp !== undefined ? { inApp } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(sms !== undefined ? { sms } : {}),
      ...(push !== undefined ? { push } : {}),
    },
    create: {
      userId,
      type,
      inApp: inApp ?? true,
      email: email ?? true,
      sms: sms ?? false,
      push: push ?? true,
    },
  });

  return updated;
}

module.exports = {
  createNotification,
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreference,
};
