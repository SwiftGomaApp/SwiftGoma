const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { sendSessionRevokedEmail } = require("../../../services/email.service");

const removeSession = async ({ userId, sessionId, currentSessionId }) => {
  if (sessionId === currentSessionId) {
    throw errors.badRequest(
      "Impossible de déconnecter la session active. Utilisez la déconnexion normale.",
    );
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true },
  });

  if (!session) throw errors.notFound("Session");
  if (session.userId !== userId) throw errors.forbidden();

  await prisma.session.delete({ where: { id: sessionId } });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (user?.email) {
    sendSessionRevokedEmail({
      to: user.email,
      name: user.name,
      count: 1,
    }).catch((err) =>
      console.error("📧 Session revoked email error:", err.message),
    );
  }

  return true;
};

const removeAllOtherSessions = async ({ userId, currentSessionId }) => {
  const { count } = await prisma.session.deleteMany({
    where: {
      userId,
      id: { not: currentSessionId },
    },
  });

  if (count > 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (user?.email) {
      sendSessionRevokedEmail({
        to: user.email,
        name: user.name,
        count,
      }).catch((err) =>
        console.error("📧 Session revoked email error:", err.message),
      );
    }
  }

  return { count };
};

module.exports = { removeSession, removeAllOtherSessions };
