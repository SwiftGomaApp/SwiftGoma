const Redis = require("ioredis");
const { redis_url } = require("./env.config");

const redis = new Redis(redis_url || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err.message));
redis.on("close", () => console.log("Redis connection closed"));
redis.on("reconnecting", () => console.log("Redis reconnecting..."));

const keys = {
  otp: (userId, type) => `otp:${userId}:${type}`,
  otpAttempts: (userId, type) => `otp_attempts:${userId}:${type}`,
  refreshToken: (token) => `refresh_token:${token}`,
  session: (sessionId) => `session:${sessionId}`,
  passkeyChallenge: (userId) => `passkey_challenge:${userId}`,
  blacklistedToken: (jti) => `blacklisted:${jti}`,
  rateLimitLogin: (ip) => `rate_limit:login:${ip}`,
};

const setEx = async (key, value, ttlSeconds) => {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
};

const get = async (key) => {
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const del = async (key) => {
  await redis.del(key);
};

const exists = async (key) => {
  return (await redis.exists(key)) === 1;
};

const incr = async (key, ttlSeconds) => {
  const count = await redis.incr(key);
  if (count === 1 && ttlSeconds) {
    await redis.expire(key, ttlSeconds);
  }
  return count;
};

module.exports = { redis, keys, setEx, get, del, exists, incr };
