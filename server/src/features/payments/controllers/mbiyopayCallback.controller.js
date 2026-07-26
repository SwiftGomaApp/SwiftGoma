const { verifyWebhookSignature } = require("../utils/mbiyopay.utils");
const {
  confirmOrderPayment,
  failOrderPayment,
} = require("../../orders/services/order.service");

async function postMbiyoPayCallback(req, res, next) {
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers["signature"];

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("[mbiyopay-callback] Invalid signature — rejecting.");
      return res.status(200).json({ received: true });
    }

    const { transaction_id, order_id, status, type } = req.body;

    console.log(
      `[mbiyopay-callback] ${type} ${transaction_id} status=${status} order_id=${order_id}`,
    );

    if (type === "cashin") {
      try {
        if (status === "successful") {
          await confirmOrderPayment(transaction_id, order_id);
        } else if (status === "failed") {
          await failOrderPayment(
            transaction_id,
            `MbiyoPay payin failed (order_id: ${order_id})`,
            order_id,
          );
        }
      } catch (err) {
        console.error(
          `[mbiyopay-callback] Failed to process cashin ${transaction_id} (order_id: ${order_id}):`,
          err.message,
        );
      }
    }

    if (type === "cashout") {
      console.log(
        `[mbiyopay-callback] Payout callback received, no handler wired yet.`,
      );
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("[mbiyopay-callback] Error handling callback:", err.message);
    res
      .status(200)
      .json({ received: true, error: "internal_processing_error" });
  }
}

module.exports = { postMbiyoPayCallback };
