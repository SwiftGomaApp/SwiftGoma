const { getPrismaClient } = require("../../../config/prisma");
const { FORCED_NOTIFICATION_TYPES } = require("../config/notificationTypes");

const DEFAULT_CHANNELS = { inApp: true, email: true, sms: false, push: true };
const FORCED_CHANNELS = { inApp: true, email: true, sms: true, push: true };

async function resolveChannels(userId, type) {
  if (FORCED_NOTIFICATION_TYPES.includes(type)) {
    return { ...FORCED_CHANNELS };
  }

  const prisma = getPrismaClient();
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId_type: { userId, type } },
  });

  if (!pref) return { ...DEFAULT_CHANNELS };

  return {
    inApp: pref.inApp,
    email: pref.email,
    sms: pref.sms,
    push: pref.push,
  };
}

function channelsToArray(channels) {
  return Object.entries(channels)
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel);
}

module.exports = {
  resolveChannels,
  channelsToArray,
  DEFAULT_CHANNELS,
  FORCED_CHANNELS,
};
