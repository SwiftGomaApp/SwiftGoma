const { catchAsync } = require("../../../shared/utils/catchAsync");
const { AppError } = require("../../../shared/errors/app.error");
const { signedCallbacks, authority } = require("../config/pawapay.config");
const { verifyCallbackSignature } = require("../config/pawapay.signature");
const { getPublicKeyById } = require("../security/pawapay.publicKeys");
const {
  sendDepositSuccessEmail,
  sendDepositFailedEmail,
  sendPayoutSuccessEmail,
  sendPayoutFailedEmail,
  sendRefundSuccessEmail,
  sendRefundFailedEmail,
} = require("../emails/pawapay.emails");

const verifyIfNeeded = async (req) => {
  if (!signedCallbacks) return;

  const keyidMatch = (req.headers["signature-input"] || "").match(
    /keyid="([^"]+)"/,
  );
  if (!keyidMatch) {
    throw new AppError(
      "En-tête de signature manquant.",
      401,
      "MISSING_SIGNATURE",
    );
  }

  const publicKeyPem = await getPublicKeyById(keyidMatch[1]);

  const { valid, reason } = verifyCallbackSignature({
    method: req.method,
    authority,
    path: req.originalUrl,
    headers: req.headers,
    rawBody: req.rawBody,
    publicKeyPem,
  });

  if (!valid) {
    throw new AppError(
      `Signature de callback invalide: ${reason}`,
      401,
      "INVALID_CALLBACK_SIGNATURE",
    );
  }
};

const handleDepositCallback = catchAsync(async (req, res) => {
  await verifyIfNeeded(req);

  const { depositId, status, failureReason, metadata } = req.body;
  const depositType = metadata?.depositType;

  console.log(
    `📩 Deposit callback — depositId: ${depositId}, status: ${status}, depositType: ${metadata?.depositType}`,
  );
  if (failureReason) {
    console.log(`❌ Failure reason:`, JSON.stringify(failureReason, null, 2));
  }
  console.log(`📦 Full callback body:`, JSON.stringify(req.body, null, 2));

  if (status === "COMPLETED") {
    switch (depositType) {
      case "SUBSCRIPTION":
        // TODO: Activate or renew seller subscription.
        break;

      case "ORDER":
        // TODO: Mark order as paid and trigger fulfillment.
        break;

      case "WALLET_TOPUP":
        // TODO: Credit the user's wallet balance.
        break;

      default:
        // TODO: Handle unknown deposit type.
        console.error(
          `⚠️ Unknown depositType "${depositType}" for deposit ${depositId}`,
        );
    }

    if (metadata?.userEmail) {
      await sendDepositSuccessEmail({
        to: metadata.userEmail,
        name: metadata.userName || "Client",
        amount: req.body.depositedAmount || req.body.requestedAmount,
        currency: req.body.currency,
        depositId,
      });
    }
  } else if (status === "FAILED") {
    switch (depositType) {
      case "SUBSCRIPTION":
        // TODO: Handle failed subscription payment (e.g. notify seller, allow retry).
        break;

      case "ORDER":
        // TODO: Handle failed order payment (e.g. release reserved stock).
        break;

      case "WALLET_TOPUP":
        // TODO: Handle failed wallet top-up.
        break;

      default:
        // TODO: Handle unknown deposit type.
        console.error(
          `⚠️ Unknown depositType "${depositType}" for deposit ${depositId}`,
        );
    }

    if (metadata?.userEmail) {
      await sendDepositFailedEmail({
        to: metadata.userEmail,
        name: metadata.userName || "Client",
        amount: req.body.requestedAmount,
        currency: req.body.currency,
        depositId,
        failureReason: failureReason?.failureMessage,
      });
    }
  }

  res.status(200).json({ received: true });
});

// ─── Payout callback ────────────────────────────────────────────────────────
// TODO: replace with real DB lookups once payout-triggering features (seller payouts, deliverer payouts, refund-to-wallet, etc.) exist.

const handlePayoutCallback = catchAsync(async (req, res) => {
  await verifyIfNeeded(req);

  const { payoutId, status, failureReason, metadata } = req.body;

  console.log(
    `📩 Payout callback received — payoutId: ${payoutId}, status: ${status}`,
  );

  if (status === "COMPLETED") {
    // TODO: Mark payout as completed in your DB once payouts are implemented.
    if (metadata?.userEmail) {
      await sendPayoutSuccessEmail({
        to: metadata.userEmail,
        name: metadata.userName || "Client",
        amount: req.body.amount,
        currency: req.body.currency,
        payoutId,
      });
    }
  } else if (status === "FAILED") {
    // TODO: Mark payout as failed, credit back internal wallet if applicable.
    if (metadata?.userEmail) {
      await sendPayoutFailedEmail({
        to: metadata.userEmail,
        name: metadata.userName || "Client",
        amount: req.body.amount,
        currency: req.body.currency,
        payoutId,
        failureReason: failureReason?.failureMessage,
      });
    }
  }

  res.status(200).json({ received: true });
});

// ─── Refund callback ────────────────────────────────────────────────────────
// TODO: replace with real DB lookups once refund-triggering features exist.

const handleRefundCallback = catchAsync(async (req, res) => {
  await verifyIfNeeded(req);

  const { refundId, status, failureReason, metadata } = req.body;

  console.log(
    `📩 Refund callback received — refundId: ${refundId}, status: ${status}`,
  );

  if (status === "COMPLETED") {
    // TODO: Mark refund as completed in your DB once refunds are implemented.
    if (metadata?.userEmail) {
      await sendRefundSuccessEmail({
        to: metadata.userEmail,
        name: metadata.userName || "Client",
        amount: req.body.amount,
        currency: req.body.currency,
        refundId,
      });
    }
  } else if (status === "FAILED") {
    // TODO: Mark refund as failed, flag for manual review.
    if (metadata?.userEmail) {
      await sendRefundFailedEmail({
        to: metadata.userEmail,
        name: metadata.userName || "Client",
        amount: req.body.amount,
        currency: req.body.currency,
        refundId,
        failureReason: failureReason?.failureMessage,
      });
    }
  }

  res.status(200).json({ received: true });
});

module.exports = {
  handleDepositCallback,
  handlePayoutCallback,
  handleRefundCallback,
};
