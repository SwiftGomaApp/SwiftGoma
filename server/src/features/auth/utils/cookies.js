const { env, isProduction } = require("../../../config/env");

const REFRESH_TOKEN_COOKIE = "swg_refresh_token";
const ACCESS_TOKEN_COOKIE = "swg_access_token";

const REFRESH_TOKEN_MAX_AGE_MS =
  env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_MAX_AGE_MS = env.jwt.accessExpiresInMinutes * 60 * 1000;

function shouldUseSharedCookieDomain(req) {
  if (!env.cookie.domain) return false;

  const origin = req?.headers?.origin;
  if (!origin) return true;

  const bareDomain = env.cookie.domain.replace(/^\./, "");
  try {
    const { hostname } = new URL(origin);
    return hostname === bareDomain || hostname.endsWith(`.${bareDomain}`);
  } catch {
    return false;
  }
}

function baseCookieOptions(req) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: env.cookie.sameSite,
    ...(shouldUseSharedCookieDomain(req) ? { domain: env.cookie.domain } : {}),
  };
}

function refreshCookieOptions(req) {
  return {
    ...baseCookieOptions(req),
    path: "/api/v1/auth",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  };
}

function accessCookieOptions(req) {
  return {
    ...baseCookieOptions(req),
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  };
}

function setRefreshTokenCookie(res, token, req) {
  res.cookie(REFRESH_TOKEN_COOKIE, token, refreshCookieOptions(req));
}

function clearRefreshTokenCookie(res, req) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, refreshCookieOptions(req));
}

function getRefreshTokenFromRequest(req) {
  return req.cookies?.[REFRESH_TOKEN_COOKIE] || null;
}

function setAccessTokenCookie(res, token, req) {
  res.cookie(ACCESS_TOKEN_COOKIE, token, accessCookieOptions(req));
}

function clearAccessTokenCookie(res, req) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, accessCookieOptions(req));
}

function getAccessTokenFromRequest(req) {
  return req.cookies?.[ACCESS_TOKEN_COOKIE] || null;
}

module.exports = {
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setAccessTokenCookie,
  clearAccessTokenCookie,
  getAccessTokenFromRequest,
};
