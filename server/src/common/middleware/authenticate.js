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
    throw new UnauthorizedError("Authentication required.");
  }

  const claims = verifyAccessToken(token);

  // Re-checked on every request (not just baked into the JWT) so a block
  // takes effect immediately instead of waiting out the access token's
  // remaining lifetime.
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { isBlocked: true },
  });
  if (!user) {
    throw new UnauthorizedError(
      "Session invalide ou expirée. Veuillez vous reconnecter.",
    );
  }
  if (user.isBlocked) {
    throw new ForbiddenError("Ce compte a été bloqué. Contactez le support.");
  }

  req.user = { id: claims.sub, role: claims.role, sessionId: claims.sessionId };
  next();
}

module.exports = { authenticate };
