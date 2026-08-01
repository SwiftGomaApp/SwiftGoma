const { QUEUE_NAMES } = require("../common/constants/queueNames");
const { createWorker } = require("../config/worker");
const {
  retryFailedPayout,
} = require("../features/wallet/services/wallet.service");

async function processPayoutJob(job) {
  switch (job.name) {
    case "retry-payout":
      return retryFailedPayout(job.data.walletTransactionId);

    default:
      console.warn(
        `[payouts worker] Unknown job name "${job.name}" — skipping.`,
      );
  }
}

function startPayoutsWorker() {
  const worker = createWorker(QUEUE_NAMES.PAYOUTS, processPayoutJob);

  worker.on("failed", (job, err) => {
    console.error(
      `[payouts worker] "${job?.name}" failed for payload ${JSON.stringify(job?.data)}:`,
      err.message,
    );
  });

  console.log("[payouts worker] Listening on queue:", QUEUE_NAMES.PAYOUTS);
  return worker;
}

module.exports = { startPayoutsWorker };
