const { verifyAccessToken } = require("../../config/jwt");
const { UnauthorizedError } = require("../errors");
const {
  getAccessTokenFromRequest,
} = require("../../features/auth/utils/cookies");

function authenticate(req, res, next) {
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

  req.user = { id: claims.sub, role: claims.role, sessionId: claims.sessionId };
  next();
}

module.exports = { authenticate };
