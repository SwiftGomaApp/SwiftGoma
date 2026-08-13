const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const { getRedisClient } = require("../../config/redis");
const { TooManyRequestsError } = require("../errors");

function buildStore(name) {
  const client = getRedisClient();
  if (!client) return undefined;

  return new RedisStore({
    sendCommand: (...args) => client.call(...args),
    prefix: `rl:${name}:`,
  });
}

function userOrIpKey(req) {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  return `ip:${req.ip}`;
}

function createRateLimiter({ name, windowMs, max, message, keyGenerator }) {
  if (!name) {
    throw new Error(
      "createRateLimiter : `name` est requis (utilisé pour namespacer les clés Redis de ce limiteur).",
    );
  }
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    store: buildStore(name),
    ...(keyGenerator && { keyGenerator }),
    handler: (req, res, next) => {
      next(new TooManyRequestsError(message));
    },
  });
}

module.exports = { createRateLimiter, userOrIpKey };
