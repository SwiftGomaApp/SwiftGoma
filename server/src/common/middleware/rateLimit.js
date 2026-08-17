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

function userOrIpKey(req, res) {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  return `ip:${rateLimit.ipKeyGenerator(req, res)}`;
}

function emailOrIpKey(req, res) {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : null;
  const ip = rateLimit.ipKeyGenerator(req, res);
  return email ? `ip:${ip}|email:${email}` : `ip:${ip}`;
}

const VIOLATIONS_BEFORE_BLOCK = 5;
const VIOLATIONS_WINDOW_MS = 15 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

async function recordViolationAndMaybeBlock(req) {
  const client = getRedisClient();
  if (!client) return;

  const ip = rateLimit.ipKeyGenerator(req, req.res);
  const violationsKey = `rl:violations:${ip}`;
  const blockKey = `rl:blocked:${ip}`;

  const count = await client.incr(violationsKey);
  if (count === 1) {
    await client.pexpire(violationsKey, VIOLATIONS_WINDOW_MS);
  }

  if (count >= VIOLATIONS_BEFORE_BLOCK) {
    await client.set(blockKey, "1", "PX", BLOCK_DURATION_MS);
  }
}

function createRateLimiter({
  name,
  windowMs,
  max,
  message,
  keyGenerator,
  trackViolations = false,
}) {
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
      if (trackViolations) {
        recordViolationAndMaybeBlock(req).catch((err) => {
          console.error("[rateLimit] violation tracking failed:", err.message);
        });
      }
      next(new TooManyRequestsError(message, Math.ceil(windowMs / 1000)));
    },
  });
}

module.exports = { createRateLimiter, userOrIpKey, emailOrIpKey };
