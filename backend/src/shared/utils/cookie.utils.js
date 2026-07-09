const jwt = require("jsonwebtoken");
const { AppError } = require("../errors/app.error");
const {
  jwt_access_secret,
  jwt_refresh_secret,
  jwt_access_expires_in,
  jwt_refresh_expires_in,
  node_env,
} = require("../../config/env.config");

const ACCESS_COOKIE_NAME = "swg_access";
const REFRESH_COOKIE_NAME = "swg_refresh";

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: node_env === "production",
  sameSite: node_env === "production" ? "strict" : "lax",
  path: "/",
};

const ACCESS_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000,
};

const REFRESH_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/v1/auth/refresh",
};

const signAccessToken = (payload) => {
  return jwt.sign(payload, jwt_access_secret, {
    expiresIn: jwt_access_expires_in || "15m",
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, jwt_refresh_secret, {
    expiresIn: jwt_refresh_expires_in || "7d",
  });
};

const setAccessCookie = (res, payload) => {
  const token = signAccessToken(payload);
  res.cookie(ACCESS_COOKIE_NAME, token, ACCESS_COOKIE_OPTIONS);
  return token;
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
};

const setAuthCookies = (res, { userId, role, sessionId }) => {
  const accessToken = signAccessToken({ userId, role, sessionId });
  res.cookie(ACCESS_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS);

  return accessToken;
};

const clearAccessCookie = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, { ...BASE_COOKIE_OPTIONS });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...BASE_COOKIE_OPTIONS,
    path: "/api/v1/auth/refresh",
  });
};

const clearAuthCookies = (res) => {
  clearAccessCookie(res);
  clearRefreshCookie(res);
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, jwt_access_secret);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError(
        "Votre session a expiré. Veuillez vous reconnecter.",
        401,
        "TOKEN_EXPIRED",
      );
    }
    throw new AppError("Token invalide.", 401, "INVALID_TOKEN");
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, jwt_refresh_secret);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError(
        "Votre session a expiré. Veuillez vous reconnecter.",
        401,
        "TOKEN_EXPIRED",
      );
    }
    throw new AppError("Token invalide.", 401, "INVALID_TOKEN");
  }
};

const getAccessToken = (req) => {
  return req.cookies?.[ACCESS_COOKIE_NAME] || null;
};

const getRefreshToken = (req) => {
  return req.cookies?.[REFRESH_COOKIE_NAME] || null;
};

module.exports = {
  setAuthCookies,
  setAccessCookie,
  setRefreshCookie,
  clearAuthCookies,
  clearAccessCookie,
  clearRefreshCookie,
  verifyAccessToken,
  verifyRefreshToken,
  getAccessToken,
  getRefreshToken,
  signAccessToken,
  signRefreshToken,
};
