const { env, isProduction } = require("../../../config/env");

const REFRESH_TOKEN_COOKIE = "swg_refresh_token";
const ACCESS_TOKEN_COOKIE = "swg_access_token";

const REFRESH_TOKEN_MAX_AGE_MS =
  env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_MAX_AGE_MS = env.jwt.accessExpiresInMinutes * 60 * 1000;

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: env.cookie.sameSite,
    ...(env.cookie.domain && { domain: env.cookie.domain }),
  };
}

function refreshCookieOptions() {
  return {
    ...baseCookieOptions(),
    path: "/api/v1/auth",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  };
}

function accessCookieOptions() {
  return {
    ...baseCookieOptions(),
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  };
}

function setRefreshTokenCookie(res, token) {
  res.cookie(REFRESH_TOKEN_COOKIE, token, refreshCookieOptions());
}

function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, refreshCookieOptions());
}

function getRefreshTokenFromRequest(req) {
  return req.cookies?.[REFRESH_TOKEN_COOKIE] || null;
}

function setAccessTokenCookie(res, token) {
  res.cookie(ACCESS_TOKEN_COOKIE, token, accessCookieOptions());
}

function clearAccessTokenCookie(res) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, accessCookieOptions());
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
