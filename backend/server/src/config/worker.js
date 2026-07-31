const { Worker } = require("bullmq");
const Sentry = require("@sentry/node");

const { getRedisClient } = require("./redis");

function createWorker(name, processor, options = {}) {
  const connection = getRedisClient();
  if (!connection) {
    throw new Error(
      `Cannot create worker "${name}": REDIS_URL is not set. Background jobs require a real Redis instance.`,
    );
  }

  const worker = new Worker(name, processor, { connection, ...options });

  worker.on("completed", (job) => {
    console.log(`[queue:${name}] Job ${job.id} completed.`);
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[queue:${name}] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`,
      err.message,
    );
    if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
      Sentry.captureException(err, { tags: { queue: name, jobId: job.id } });
    }
  });

  return worker;
}

module.exports = { createWorker };
