const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const { getRedisClient } = require("../../config/redis");
const { TooManyRequestsError } = require("../errors");

function buildStore() {
  const client = getRedisClient();

  if (!client) return undefined;

  return new RedisStore({
    sendCommand: (...args) => client.call(...args),
    prefix: "rl:",
  });
}

function createRateLimiter({ windowMs, max, message, keyGenerator }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true, // adds RateLimit-* response headers
    legacyHeaders: false,
    store: buildStore(),
    ...(keyGenerator && { keyGenerator }),
    handler: (req, res, next) => {
      next(new TooManyRequestsError(message));
    },
  });
}

module.exports = { createRateLimiter };
