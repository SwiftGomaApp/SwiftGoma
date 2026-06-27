const { prisma } = require("../../config/db.config");
const { keys, setEx, del } = require("../../config/redis.config");
const { signRefreshToken } = require("./cookie.utils");

const REFRESH_TOKEN_EXPIRES_DAYS = 7;
const REFRESH_TOKEN_EXPIRES_SECONDS = REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60;

const createSession = async ({ userId, role, deviceInfo }) => {
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

  await prisma.refreshToken.create({
    data: {
      userId,
      sessionId: session.id, // ← ajouté
      token: refreshToken,
      expiresAt,
    },
  });

  await setEx(
    keys.session(session.id),
    { userId, role, sessionId: session.id },
    REFRESH_TOKEN_EXPIRES_SECONDS,
  );

  return { session, refreshToken };
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

module.exports = { createSession, revokeSession, revokeAllSessions };