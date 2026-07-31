const jwt = require("jsonwebtoken");

const { env, isProduction } = require("./env");
const { UnauthorizedError } = require("../common/errors");

const ISSUER = "swiftgoma";
const AUDIENCE = "swiftgoma-app";

if (isProduction) {
  const MIN_SECRET_LENGTH = 32;
  if (
    !env.jwt.accessSecret ||
    env.jwt.accessSecret.length < MIN_SECRET_LENGTH
  ) {
    throw new Error(
      `JWT_ACCESS_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters in production.`,
    );
  }
  if (
    !env.jwt.refreshSecret ||
    env.jwt.refreshSecret.length < MIN_SECRET_LENGTH
  ) {
    throw new Error(
      `JWT_REFRESH_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters in production.`,
    );
  }
  if (env.jwt.accessSecret === env.jwt.refreshSecret) {
    throw new Error(
      "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.",
    );
  }
}

function signAccessToken({ userId, role, sessionId }) {
  return jwt.sign(
    { sub: userId, role, sessionId, type: "access" },
    env.jwt.accessSecret,
    {
      algorithm: "HS256",
      expiresIn: `${env.jwt.accessExpiresInMinutes}m`,
      issuer: ISSUER,
      audience: AUDIENCE,
    },
  );
}

function signRefreshToken({ userId, sessionId }) {
  return jwt.sign(
    { sub: userId, sessionId, type: "refresh" },
    env.jwt.refreshSecret,
    {
      algorithm: "HS256",
      expiresIn: `${env.jwt.refreshExpiresInDays}d`,
      issuer: ISSUER,
      audience: AUDIENCE,
    },
  );
}

function verify(token, secret, expectedType) {
  let payload;
  try {
    payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new UnauthorizedError("Session expired. Please log in again.");
    }
    throw new UnauthorizedError("Invalid authentication token.");
  }

  if (payload.type !== expectedType) {
    throw new UnauthorizedError("Invalid authentication token.");
  }

  return payload;
}

function verifyAccessToken(token) {
  return verify(token, env.jwt.accessSecret, "access");
}

function verifyRefreshToken(token) {
  return verify(token, env.jwt.refreshSecret, "refresh");
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
