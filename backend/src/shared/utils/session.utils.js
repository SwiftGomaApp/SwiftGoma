const { prisma } = require("../../config/db.config");
const { keys, setEx, del } = require("../../config/redis.config");
const { signRefreshToken } = require("./cookie.utils");
const { AppError } = require("../errors/app.error");

const REFRESH_TOKEN_EXPIRES_DAYS = 7;
const REFRESH_TOKEN_EXPIRES_SECONDS = REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60;

const createSession = async ({
  userId,
  role,
  deviceInfo,
  platform = "WEB",
  deviceId = null,
}) => {
  if (platform === "MOBILE" && !deviceId) {
    throw new AppError(
      "Identifiant d'appareil requis pour les connexions mobiles.",
      400,
      "DEVICE_ID_REQUIRED",
    );
  }

  const { os, browser, device, ip } = deviceInfo;

  const session = await prisma.session.create({
    data: { userId, device, browser, os, ip },
  });

  const refreshToken = signRefreshToken({
    userId,
    role,
    sessionId: session.id,
  });

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_SECONDS * 1000);

  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      userId,
      sessionId: session.id,
      token: refreshToken,
      expiresAt,
      platform,
      deviceId,
    },
  });

  await setEx(
    keys.session(session.id),
    { userId, role, sessionId: session.id },
    REFRESH_TOKEN_EXPIRES_SECONDS,
  );

  return { session, refreshToken, refreshTokenId: refreshTokenRecord.id };
};

const rotateRefreshToken = async ({
  storedToken,
  role,
  deviceInfo,
  platform,
  deviceId,
}) => {
  if (storedToken.replacedByToken) {
    await revokeSession(storedToken.sessionId);
    throw new AppError(
      "Session compromise détectée. Veuillez vous reconnecter sur tous vos appareils.",
      401,
      "TOKEN_REUSE_DETECTED",
    );
  }

  if (storedToken.platform === "MOBILE" && storedToken.deviceId !== deviceId) {
    await revokeSession(storedToken.sessionId);
    throw new AppError(
      "Cet appareil ne correspond pas à la session d'origine.",
      401,
      "DEVICE_MISMATCH",
    );
  }

  const {
    session,
    refreshToken: newRefreshToken,
    refreshTokenId,
  } = await createSession({
    userId: storedToken.userId,
    role,
    deviceInfo,
    platform,
    deviceId,
  });

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date(), replacedByToken: refreshTokenId },
  });

  return { session, refreshToken: newRefreshToken };
};

const revokeSession = async (sessionId) => {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});

  await prisma.refreshToken.updateMany({
    where: { sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await del(keys.session(sessionId));
};

const revokeAllSessions = async (userId) => {
  const sessions = await prisma.session.findMany({
    where: { userId },
    select: { id: true },
  });

  await Promise.all(sessions.map((s) => del(keys.session(s.id))));

  await prisma.session.deleteMany({ where: { userId } });

  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

module.exports = {
  createSession,
  rotateRefreshToken,
  revokeSession,
  revokeAllSessions,
};
