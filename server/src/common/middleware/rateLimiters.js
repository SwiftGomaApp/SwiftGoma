const { createRateLimiter, userOrIpKey } = require("./rateLimit");
const { env } = require("../../config/env");

const isTest = env.nodeEnv === "test";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const globalLimiter = createRateLimiter({
  name: "global",
  windowMs: 15 * 60 * 1000,
  max: isTest ? 100_000 : 300,
  message: "Trop de requêtes. Veuillez ralentir et réessayer dans un instant.",
});

const authLimiter = createRateLimiter({
  name: "auth",
  windowMs: 15 * 60 * 1000,
  max: isTest ? 100_000 : 10,
  message:
    "Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.",
});

const paymentLimiter = createRateLimiter({
  name: "payment",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isTest ? 100_000 : 20,
  message:
    "Trop de requêtes de paiement. Veuillez patienter avant de réessayer.",
});

const payoutOtpLimiter = createRateLimiter({
  name: "payout-otp",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isTest ? 100_000 : 10,
  message:
    "Trop de demandes de vérification de paiement. Veuillez patienter avant de réessayer.",
  keyGenerator: userOrIpKey,
});

const payoutOtpResendLimiter = createRateLimiter({
  name: "payout-otp-resend",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isTest ? 100_000 : 3,
  message:
    "Trop de tentatives de renvoi de code de paiement. Veuillez patienter avant de réessayer.",
  keyGenerator: userOrIpKey,
});

const payoutConfirmLimiter = createRateLimiter({
  name: "payout-confirm",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isTest ? 100_000 : 5,
  message:
    "Trop de confirmations de paiement. Veuillez patienter avant de réessayer.",
  keyGenerator: userOrIpKey,
});

const webhookLimiter = createRateLimiter({
  name: "webhook",
  windowMs: FIFTEEN_MINUTES_MS,
  max: isTest ? 100_000 : 500,
  message: "Trop de requêtes webhook.",
});

const chatMessageLimiter = createRateLimiter({
  name: "chat-message",
  windowMs: 60 * 1000,
  max: isTest ? 100_000 : 20,
  message: "Trop de messages envoyés. Veuillez ralentir.",
  keyGenerator: userOrIpKey,
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
};
