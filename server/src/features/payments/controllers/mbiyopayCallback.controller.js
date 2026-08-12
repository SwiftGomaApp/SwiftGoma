const { verifyWebhookSignature } = require("../utils/mbiyopay.utils");
const {
  confirmOrderPayment,
  failOrderPayment,
  confirmOrderRefund,
  failOrderRefund,
} = require("../../orders/services/order.service");
const {
  confirmSellerPayout,
  failSellerPayout,
} = require("../../wallet/services/wallet.service");

async function postMbiyoPayCallback(req, res, next) {
  try {
    // Use the exact bytes MbiyoPay signed (captured by the express.json
    // `verify` hook in app.js) rather than re-serializing req.body — a
    // JSON.stringify round-trip isn't guaranteed to byte-match what was
    // actually sent (key order, number formatting, escaping), which could
    // cause legitimate callbacks to fail signature verification.
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const signature = req.headers["signature"];

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("[mbiyopay-callback] Invalid signature — rejecting.");

      return res
        .status(401)
        .json({ received: false, error: "invalid_signature" });
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
      const isOrderRefund =
        typeof order_id === "string" && order_id.startsWith("SWG-REFUND-");
      try {
        if (status === "successful") {
          if (isOrderRefund) {
            await confirmOrderRefund(transaction_id, order_id);
          } else {
            await confirmSellerPayout(transaction_id, order_id);
          }
        } else if (status === "failed" || status === "cancelled") {
          if (isOrderRefund) {
            await failOrderRefund(
              transaction_id,
              `MbiyoPay refund payout ${status} (order_id: ${order_id})`,
              order_id,
            );
          } else {
            await failSellerPayout(
              transaction_id,
              `MbiyoPay payout ${status} (order_id: ${order_id})`,
              order_id,
            );
          }
        }
      } catch (err) {
        console.error(
          `[mbiyopay-callback] Failed to process cashout ${transaction_id} (order_id: ${order_id}):`,
          err.message,
        );
      }
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
