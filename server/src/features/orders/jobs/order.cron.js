const cron = require("node-cron");
const { autoCompleteDeliveredOrders } = require("../services/order.service");

const startOrderCron = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("🔄 Running order auto-complete check...");
    try {
      await autoCompleteDeliveredOrders();
    } catch (err) {
      console.error("⚠️  Order cron error:", err.message);
    }
  });

  console.log("✅ Order cron started");
};

module.exports = { startOrderCron };
