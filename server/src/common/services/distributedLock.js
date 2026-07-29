const { getRedisClient } = require("../../config/redis");

async function withLock(key, ttlMs, fn) {
  const redis = getRedisClient();

  if (!redis) {
    console.warn(
      `[lock] Redis unavailable — running "${key}" without a distributed lock.`,
    );
    return fn();
  }

  const token = `${process.pid}-${Date.now()}`;
  const acquired = await redis.set(`lock:${key}`, token, "PX", ttlMs, "NX");

  if (!acquired) {
    console.log(
      `[lock] "${key}" already running on another instance — skipping this tick.`,
    );
    return null;
  }

  try {
    return await fn();
  } finally {
    const current = await redis.get(`lock:${key}`);
    if (current === token) {
      await redis.del(`lock:${key}`);
    }
  }
}

module.exports = { withLock };
