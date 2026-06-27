const cron = require("node-cron");
const {
  checkExpiringSubscriptions,
} = require("../services/subscription.service");

const startSubscriptionCron = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      await checkExpiringSubscriptions();
      console.log("✅ Subscription expiry check completed");
    } catch (err) {
      console.error("⚠️  Subscription cron error:", err.message);
    }
  });

  console.log("✅ Subscription expiry cron started");
};

module.exports = { startSubscriptionCron };
