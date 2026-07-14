const IORedis = require("ioredis");

const { env } = require("./env");

let client = null;

function getRedisClient() {
  if (!env.redisUrl) return null;

  if (!client) {
    client = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
    });
    client.on("error", (err) => {
      console.error("[redis] connection error:", err.message);
    });
  }

  return client;
}

module.exports = { getRedisClient };
