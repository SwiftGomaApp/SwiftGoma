const { createRateLimiter } = require("./rateLimit");
const { env } = require("../../config/env");

const isTest = env.nodeEnv === "test";

const globalLimiter = createRateLimiter({
  name: "global",
  windowMs: 15 * 60 * 1000, // 15 min
  max: isTest ? 100_000 : 300,
  message: "Too many requests. Please slow down and try again shortly.",
});

const authLimiter = createRateLimiter({
  name: "auth",
  windowMs: 15 * 60 * 1000,
  max: isTest ? 100_000 : 10,
  message: "Too many attempts. Please wait a few minutes before trying again.",
});

const paymentLimiter = createRateLimiter({
  name: "payment",
  windowMs: 15 * 60 * 1000,
  max: isTest ? 100_000 : 20,
  message: "Too many payment requests. Please wait before trying again.",
});

module.exports = { globalLimiter, authLimiter, paymentLimiter };
