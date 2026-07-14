const { getRedisClient } = require("../../config/redis");

const DEFAULT_TTL_SECONDS = 300;
const PREFIX = "cache:";

function isAvailable() {
  return Boolean(getRedisClient());
}

async function get(key) {
  const client = getRedisClient();
  if (!client) return null;
  try {
    const raw = await client.get(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error(`[cache] get("${key}") failed:`, err.message);
    return null;
  }
}

async function set(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const client = getRedisClient();
  if (!client) return false;
  try {
    await client.set(PREFIX + key, JSON.stringify(value), "EX", ttlSeconds);
    return true;
  } catch (err) {
    console.error(`[cache] set("${key}") failed:`, err.message);
    return false;
  }
}

async function del(key) {
  const client = getRedisClient();
  if (!client) return false;
  try {
    await client.del(PREFIX + key);
    return true;
  } catch (err) {
    console.error(`[cache] del("${key}") failed:`, err.message);
    return false;
  }
}

async function getOrSet(key, ttlSeconds, fetchFn) {
  const cached = await get(key);
  if (cached !== null) return cached;

  const fresh = await fetchFn();
  await set(key, fresh, ttlSeconds);
  return fresh;
}

module.exports = { get, set, del, getOrSet, isAvailable };
