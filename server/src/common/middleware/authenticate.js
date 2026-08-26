const { getPrismaClient } = require("../../config/prisma");
const { verifyAccessToken } = require("../../config/jwt");
const { UnauthorizedError, ForbiddenError } = require("../errors");
const {
  getAccessTokenFromRequest,
} = require("../../features/auth/utils/cookies");

async function authenticate(req, res, next) {
  let token = null;

  const header = req.headers.authorization || "";
  const [scheme, headerToken] = header.split(" ");
  if (scheme === "Bearer" && headerToken) {
    token = headerToken;
  } else {
    token = getAccessTokenFromRequest(req);
  }

  if (!token) {
    throw new UnauthorizedError("Authentification requise.");
  }

  const claims = verifyAccessToken(token);

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { isBlocked: true, role: true, deletedAt: true },
  });
  if (!user) {
    throw new UnauthorizedError(
      "Session invalide ou expirée. Veuillez vous reconnecter.",
    );
  }
  if (user.isBlocked) {
    throw new ForbiddenError("Ce compte a été bloqué. Contactez le support.");
  }
  if (user.deletedAt) {
    throw new UnauthorizedError(
      "Session invalide ou expirée. Veuillez vous reconnecter.",
    );
  }

  if (claims.sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: claims.sessionId },
      select: { isRevoked: true, expiresAt: true },
    });
    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedError(
        "Session invalide ou expirée. Veuillez vous reconnecter.",
      );
    }
  }

  req.user = {
    id: claims.sub,
    role: user.role,
    sessionId: claims.sessionId,
  };
  next();
}

module.exports = { authenticate };
