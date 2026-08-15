const rateLimit = require("express-rate-limit");
const { getRedisClient } = require("../../config/redis");
const { TooManyRequestsError } = require("../errors");

function ipBlockGuard() {
  return async (req, res, next) => {
    const client = getRedisClient();
    if (!client) return next();

    try {
      const ip = rateLimit.ipKeyGenerator(req, res);
      const blocked = await client.get(`rl:blocked:${ip}`);
      if (blocked) {
        return next(
          new TooManyRequestsError(
            "Votre adresse IP a été temporairement bloquée suite à des tentatives répétées. Veuillez réessayer plus tard.",
          ),
        );
      }
      next();
    } catch (err) {
      console.error("[ipBlockGuard] check failed:", err.message);
      next();
    }
  };
}

module.exports = { ipBlockGuard };
