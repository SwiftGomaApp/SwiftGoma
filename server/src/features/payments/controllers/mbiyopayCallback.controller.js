const { verifyWebhookSignature } = require("../utils/mbiyopay.utils");
const {
  confirmOrderPayment,
  failOrderPayment,
} = require("../../orders/services/order.service");

async function postMbiyoPayCallback(req, res, next) {
  try {
    // Use the exact raw request bytes MbiyoPay signed over — re-serializing
    // req.body via JSON.stringify is not guaranteed to byte-for-byte match
    // the original payload (key order/whitespace), which would break HMAC
    // verification for genuine callbacks.
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const signature = req.headers["signature"];

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("[mbiyopay-callback] Invalid signature — rejecting.");
      return res.status(401).json({ received: false, error: "invalid_signature" });
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
