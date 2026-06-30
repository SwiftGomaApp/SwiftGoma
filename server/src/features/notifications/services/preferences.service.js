const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { DEFAULT_NOTIFICATION_SETTINGS } = require("./notification.service");

const VALID_LANGUAGES = ["FR", "SW"];
const VALID_CURRENCIES = ["CDF", "USD"];
const VALID_PLATFORMS = ["WEB", "ANDROID", "IOS"];
const VALID_NOTIFICATION_TYPES = [
  "SYSTEM",
  "ORDER",
  "PAYMENT",
  "DELIVERY",
  "KYC",
  "ACCOUNT",
  "PROMOTION",
];
const VALID_CHANNELS = ["inApp", "email", "sms", "push"];

const DEFAULT_PREFS = {
  language: "FR",
  timezone: "Africa/Lubumbashi",
  currency: "CDF",
  darkMode: false,
  notifyInApp: true,
  notifyEmail: true,
  notifyPush: true,
  notifySms: false,
  notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
};

const getPreferences = async ({ userId }) => {
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
  if (!prefs) return { ...DEFAULT_PREFS, userId };

  return {
    ...prefs,
    notificationSettings: {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(prefs.notificationSettings ?? {}),
    },
  };
};

const updatePreferences = async ({
  userId,
  language,
  timezone,
  currency,
  darkMode,
  notifyInApp,
  notifyEmail,
  notifyPush,
  notifySms,
}) => {
  if (language && !VALID_LANGUAGES.includes(language)) {
    throw errors.badRequest(
      `Langue invalide. Valeurs : ${VALID_LANGUAGES.join(", ")}.`,
    );
  }
  if (currency && !VALID_CURRENCIES.includes(currency)) {
    throw errors.badRequest(
      `Devise invalide. Valeurs : ${VALID_CURRENCIES.join(", ")}.`,
    );
  }

  const data = {};
  if (language !== undefined) data.language = language;
  if (timezone !== undefined) data.timezone = timezone.trim();
  if (currency !== undefined) data.currency = currency;
  if (darkMode !== undefined) data.darkMode = Boolean(darkMode);
  if (notifyInApp !== undefined) data.notifyInApp = Boolean(notifyInApp);
  if (notifyEmail !== undefined) data.notifyEmail = Boolean(notifyEmail);
  if (notifyPush !== undefined) data.notifyPush = Boolean(notifyPush);
  if (notifySms !== undefined) data.notifySms = Boolean(notifySms);

  return prisma.userPreferences.upsert({
    where: { userId },
    create: { userId, ...DEFAULT_PREFS, ...data },
    update: data,
  });
};

const updateNotificationTypeSetting = async ({
  userId,
  type,
  channels,
}) => {
  if (!VALID_NOTIFICATION_TYPES.includes(type)) {
    throw errors.badRequest(
      `Type invalide. Valeurs : ${VALID_NOTIFICATION_TYPES.join(", ")}.`,
    );
  }

  const invalidChannels = Object.keys(channels).filter(
    (k) => !VALID_CHANNELS.includes(k),
  );
  if (invalidChannels.length > 0) {
    throw errors.badRequest(
      `Canaux invalides : ${invalidChannels.join(", ")}. Valeurs : ${VALID_CHANNELS.join(", ")}.`,
    );
  }

  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
  const currentSettings = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(prefs?.notificationSettings ?? {}),
  };

  const updatedSettings = {
    ...currentSettings,
    [type]: {
      ...DEFAULT_NOTIFICATION_SETTINGS[type],
      ...(currentSettings[type] ?? {}),
      ...Object.fromEntries(
        Object.entries(channels).map(([k, v]) => [k, Boolean(v)]),
      ),
    },
  };

  return prisma.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      ...DEFAULT_PREFS,
      notificationSettings: updatedSettings,
    },
    update: { notificationSettings: updatedSettings },
  });
};

const registerPushToken = async ({ userId, token, platform, deviceId }) => {
  if (!token?.trim()) throw errors.badRequest("Le token est requis.");
  if (!platform || !VALID_PLATFORMS.includes(platform)) {
    throw errors.badRequest(
      `Plateforme invalide. Valeurs : ${VALID_PLATFORMS.join(", ")}.`,
    );
  }

  return prisma.pushToken.upsert({
    where: { token },
    create: {
      userId,
      token: token.trim(),
      platform,
      deviceId: deviceId?.trim() ?? null,
    },
    update: {
      userId,
      platform,
      deviceId: deviceId?.trim() ?? null,
    },
  });
};

const removePushToken = async ({ userId, token }) => {
  const existing = await prisma.pushToken.findUnique({ where: { token } });
  if (!existing || existing.userId !== userId) {
    throw errors.badRequest("Token introuvable.");
  }
  await prisma.pushToken.delete({ where: { token } });
  return true;
};

const listPushTokens = async ({ userId }) => {
  return prisma.pushToken.findMany({
    where: { userId },
    select: { id: true, platform: true, deviceId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
};

const removeAllPushTokens = async ({ userId }) => {
  await prisma.pushToken.deleteMany({ where: { userId } });
  return true;
};

module.exports = {
  getPreferences,
  updatePreferences,
  updateNotificationTypeSetting,
  registerPushToken,
  removePushToken,
  listPushTokens,
  removeAllPushTokens,
};
