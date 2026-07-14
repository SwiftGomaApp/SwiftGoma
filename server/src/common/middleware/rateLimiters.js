const { createRateLimiter } = require("./rateLimit");

const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  message: "Too many requests. Please slow down and try again shortly.",
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many attempts. Please wait a few minutes before trying again.",
});

const paymentLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many payment requests. Please wait before trying again.",
});

module.exports = { globalLimiter, authLimiter, paymentLimiter };
