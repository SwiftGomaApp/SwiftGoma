const {
  initiateDeposit,
  checkDepositStatus,
  initiatePayout,
  checkPayoutStatus,
  initiateRefund,
  checkRefundStatus,
  getWalletBalances,
  getActiveConfiguration,
} = require("../services/pawapay.service");

// -----------------------------
// DEPOSITS
// -----------------------------

async function postInitiateDeposit(req, res, next) {
  try {
    const result = await initiateDeposit({
      amount: req.body.amount,
      currency: req.body.currency,
      country: req.body.country,
      provider: req.body.provider,
      payerPhoneNumber: req.body.payerPhoneNumber,
      customerMessage: req.body.customerMessage,
      clientReferenceId: req.body.clientReferenceId,
      metadata: req.body.metadata || {},
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getDepositStatus(req, res, next) {
  try {
    const result = await checkDepositStatus(req.params.depositId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// -----------------------------
// PAYOUTS
// -----------------------------

async function postInitiatePayout(req, res, next) {
  try {
    const result = await initiatePayout({
      amount: req.body.amount,
      currency: req.body.currency,
      provider: req.body.provider,
      recipientPhoneNumber: req.body.recipientPhoneNumber,
      customerMessage: req.body.customerMessage,
      clientReferenceId: req.body.clientReferenceId,
      metadata: req.body.metadata || {},
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getPayoutStatus(req, res, next) {
  try {
    const result = await checkPayoutStatus(req.params.payoutId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// -----------------------------
// REFUNDS
// -----------------------------

async function postInitiateRefund(req, res, next) {
  try {
    const result = await initiateRefund({
      depositId: req.body.depositId,
      amount: req.body.amount,
      currency: req.body.currency,
      metadata: req.body.metadata || {},
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getRefundStatus(req, res, next) {
  try {
    const result = await checkRefundStatus(req.params.refundId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// -----------------------------
// WALLET / CONFIG (ADMIN only)
// -----------------------------

async function getBalances(req, res, next) {
  try {
    const result = await getWalletBalances();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getConfiguration(req, res, next) {
  try {
    const result = await getActiveConfiguration({
      country: req.query.country,
      operationType: req.query.operationType,
      currency: req.query.currency,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postInitiateDeposit,
  getDepositStatus,
  postInitiatePayout,
  getPayoutStatus,
  postInitiateRefund,
  getRefundStatus,
  getBalances,
  getConfiguration,
};
