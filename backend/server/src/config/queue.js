const { Queue } = require("bullmq");
const { getRedisClient } = require("./redis");

const queues = new Map();

function createQueue(name, options = {}) {
  if (queues.has(name)) return queues.get(name);

  const connection = getRedisClient();
  if (!connection) {
    throw new Error(
      `Cannot create queue "${name}": REDIS_URL is not set. Background jobs require a real Redis instance — there's no in-memory fallback for this, unlike rate limiting.`,
    );
  }

  const queue = new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 24 * 3600 },
      removeOnFail: { age: 7 * 24 * 3600 },
      ...options.defaultJobOptions,
    },
    ...options,
  });

  queues.set(name, queue);
  return queue;
}

module.exports = { createQueue };
