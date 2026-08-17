const rateLimit = require("express-rate-limit");
const { getRedisClient } = require("../../config/redis");
const { IpBlockedError } = require("../errors");

function ipBlockGuard() {
  return async (req, res, next) => {
    const client = getRedisClient();
    if (!client) return next();

    try {
      const ip = rateLimit.ipKeyGenerator(req, res);
      const blockKey = `rl:blocked:${ip}`;
      const blocked = await client.get(blockKey);
      if (blocked) {
        const ttlMs = await client.pttl(blockKey);
        const retryAfterSeconds =
          ttlMs && ttlMs > 0 ? Math.ceil(ttlMs / 1000) : null;

        if (retryAfterSeconds) {
          res.set("Retry-After", String(retryAfterSeconds));
        }

        return next(new IpBlockedError(undefined, retryAfterSeconds));
      }
      next();
    } catch (err) {
      console.error("[ipBlockGuard] check failed:", err.message);
      next();
    }
  };
}

module.exports = { ipBlockGuard };
