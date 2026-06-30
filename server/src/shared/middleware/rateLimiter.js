const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "RATE_LIMIT",
    message: "Trop de requêtes. Veuillez réessayer dans quelques minutes.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "AUTH_RATE_LIMIT",
    message: "Trop de tentatives. Veuillez réessayer dans 15 minutes.",
  },
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "OTP_RATE_LIMIT",
    message: "Trop de demandes de code OTP. Veuillez réessayer dans 5 minutes.",
  },
});

module.exports = { globalLimiter, authLimiter, otpLimiter };
