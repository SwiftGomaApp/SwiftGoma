const {
  confirmSubscriptionPayment,
  failSubscriptionPayment,
} = require("../../subscriptions/services/subscription.service");

const DEPOSIT_SUCCESS_STATUSES = ["COMPLETED"];
const DEPOSIT_FAILURE_STATUSES = ["FAILED", "REJECTED"];

function extractMetadataType(body) {
  const metadata = body.metadata;

  if (Array.isArray(metadata)) {
    const typeEntry = metadata.find((entry) => "type" in entry);
    return typeEntry ? typeEntry.type : null;
  }

  if (metadata && typeof metadata === "object") {
    return metadata.type || null;
  }

  return null;
}

async function postDepositCallback(req, res, next) {
  try {
    const body = req.body;
    const depositId = body.depositId;
    const status = body.status;
    const type = extractMetadataType(body);

    console.log(
      `[pawapay-callback] deposit ${depositId} status=${status} type=${type}`,
    );

    if (!type) {
      console.error(
        `[pawapay-callback] deposit ${depositId} has no metadata.type — cannot route.`,
      );
      return res.status(200).json({ received: true });
    }

    switch (type) {
      case "SUBSCRIPTION":
        if (DEPOSIT_SUCCESS_STATUSES.includes(status)) {
          await confirmSubscriptionPayment(depositId);
        } else if (DEPOSIT_FAILURE_STATUSES.includes(status)) {
          await failSubscriptionPayment(
            depositId,
            body.failureReason?.failureMessage || "Payment failed",
          );
        }
        break;

      case "WALLET_TOPUP":
        console.warn(
          `[pawapay-callback] WALLET_TOPUP handling not implemented yet (deposit ${depositId})`,
        );
        break;

      default:
        console.error(
          `[pawapay-callback] Unknown metadata.type "${type}" for deposit ${depositId}`,
        );
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error(
      "[pawapay-callback] Error handling deposit callback:",
      err.message,
    );
    // 200 quand même — un 5xx ferait retry PawaPay indéfiniment sur une erreur
    // de notre côté qui ne se résoudra pas toute seule (ex: subscription déjà supprimée)
    res
      .status(200)
      .json({ received: true, error: "internal_processing_error" });
  }
}

module.exports = { postDepositCallback };
