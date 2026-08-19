const { createRateLimiter, userOrIpKey, emailOrIpKey } = require("./rateLimit");
const { env } = require("../../config/env");

const isDevRelaxedLimits = env.nodeEnv === "development";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const globalLimiter = createRateLimiter({
  name: "global",
  windowMs: 15 * 60 * 1000,
  max: isDevRelaxedLimits ? 100_000 : 300,
  message: "Trop de requêtes. Veuillez ralentir et réessayer dans un instant.",
});

const authLimiter = createRateLimiter({
  name: "auth",
  windowMs: 15 * 60 * 1000,
  max: isDevRelaxedLimits ? 100_000 : 10,
  message:
    "Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.",
  trackViolations: true,
});

const sessionLimiter = createRateLimiter({
  name: "session",
  windowMs: 5 * 60 * 1000,
  max: isDevRelaxedLimits ? 100_000 : 60,
  message: "Trop de requêtes de session. Veuillez patienter un instant.",
  keyGenerator: userOrIpKey,
});

const paymentLimiter = createRateLimiter({
  name: "payment",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isDevRelaxedLimits ? 100_000 : 20,
  message:
    "Trop de requêtes de paiement. Veuillez patienter avant de réessayer.",
  trackViolations: true,
});

const payoutOtpLimiter = createRateLimiter({
  name: "payout-otp",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isDevRelaxedLimits ? 100_000 : 10,
  message:
    "Trop de demandes de vérification de paiement. Veuillez patienter avant de réessayer.",
  keyGenerator: userOrIpKey,
  trackViolations: true,
});

const payoutOtpResendLimiter = createRateLimiter({
  name: "payout-otp-resend",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isDevRelaxedLimits ? 100_000 : 3,
  message:
    "Trop de tentatives de renvoi de code de paiement. Veuillez patienter avant de réessayer.",
  keyGenerator: userOrIpKey,
  trackViolations: true,
});

const payoutConfirmLimiter = createRateLimiter({
  name: "payout-confirm",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isDevRelaxedLimits ? 100_000 : 5,
  message:
    "Trop de confirmations de paiement. Veuillez patienter avant de réessayer.",
  keyGenerator: userOrIpKey,
  trackViolations: true,
});

const webhookLimiter = createRateLimiter({
  name: "webhook",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isDevRelaxedLimits ? 100_000 : 500,
  message: "Trop de requêtes webhook.",
});

const chatMessageLimiter = createRateLimiter({
  name: "chat-message",
  windowMs: 60 * 1000,
  max: isDevRelaxedLimits ? 100_000 : 20,
  message: "Trop de messages envoyés. Veuillez ralentir.",
  keyGenerator: userOrIpKey,
});

const credentialGuessLimiter = createRateLimiter({
  name: "credential-guess",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isDevRelaxedLimits ? 100_000 : 8,
  message:
    "Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.",
  keyGenerator: emailOrIpKey,
  trackViolations: true,
});

const otpRequestLimiter = createRateLimiter({
  name: "otp-request",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isDevRelaxedLimits ? 100_000 : 5,
  message: "Trop de demandes. Veuillez patienter avant de réessayer.",
  keyGenerator: emailOrIpKey,
});

const accountLimiter = createRateLimiter({
  name: "account",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isDevRelaxedLimits ? 100_000 : 8,
  message: "Trop de tentatives. Veuillez patienter avant de réessayer.",
  keyGenerator: emailOrIpKey,
});

const authenticatedActionLimiter = createRateLimiter({
  name: "auth-action",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isDevRelaxedLimits ? 100_000 : 30,
  message: "Trop de requêtes. Veuillez patienter un instant.",
  keyGenerator: userOrIpKey, // already authenticated, safe to key by user id
});

const refreshTokenLimiter = createRateLimiter({
  name: "refresh-token",
  windowMs: 5 * 60 * 1000,
  max: isDevRelaxedLimits ? 100_000 : 20,
  message: "Trop de requêtes. Veuillez patienter un instant.",
});

module.exports = {
  globalLimiter,
  authLimiter,
  paymentLimiter,
  payoutOtpLimiter,
  payoutOtpResendLimiter,
  payoutConfirmLimiter,
  webhookLimiter,
  chatMessageLimiter,
  sessionLimiter,
  credentialGuessLimiter,
  otpRequestLimiter,
  accountLimiter,
  authenticatedActionLimiter,
  refreshTokenLimiter,
};
