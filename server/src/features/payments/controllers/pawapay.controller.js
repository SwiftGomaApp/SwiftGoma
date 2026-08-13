const {
  initiateDeposit,
  checkDepositStatus,
  initiatePayout,
  checkPayoutStatus,
  checkRefundStatus,
  getWalletBalances,
  getActiveConfiguration,
} = require("../services/pawapay.service");
const { ValidationError } = require("../../../common/errors");
const {
  requestPawaPayPayoutApproval,
  confirmPawaPayPayout,
  requestPawaPayRefundApproval,
  confirmPawaPayRefundApproval,
} = require("../services/adminPayoutApproval.service");
const { listAdminPayouts } = require("../services/adminPayout.service");

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

async function postInitiatePayout(req, res, next) {
  try {
    const result = await initiatePayout({
      amount: req.body.amount,
      currency: req.body.currency,
      country: req.body.country,
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

async function postRequestPayoutApproval(req, res, next) {
  try {
    const result = await requestPawaPayPayoutApproval(req.user.id, {
      amount: req.body.amount,
      currency: req.body.currency,
      country: req.body.country,
      provider: req.body.provider,
      recipientPhoneNumber: req.body.recipientPhoneNumber,
      customerMessage: req.body.customerMessage,
      clientReferenceId: req.body.clientReferenceId,
      metadata: req.body.metadata || {},
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postConfirmPayout(req, res, next) {
  try {
    const result = await confirmPawaPayPayout(req.user.id, {
      pendingId: req.body.pendingId,
      code: req.body.code,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postRequestRefundApproval(req, res, next) {
  try {
    const result = await requestPawaPayRefundApproval(req.user.id, {
      depositId: req.body.depositId,
      amount: req.body.amount,
      currency: req.body.currency,
      country: req.body.country,
      provider: req.body.provider,
      metadata: req.body.metadata || {},
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postConfirmRefund(req, res, next) {
  try {
    const result = await confirmPawaPayRefundApproval(req.user.id, {
      pendingId: req.body.pendingId,
      code: req.body.code,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postInitiateRefund(req, res, next) {
  next(
    new ValidationError(
      "Les remboursements directs sont désactivés. Utilisez POST /pawapay/refunds/request-approval puis POST /pawapay/refunds/confirm avec le code OTP.",
    ),
  );
}

async function getRefundStatus(req, res, next) {
  try {
    const result = await checkRefundStatus(req.params.refundId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

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

async function getPayoutHistory(req, res, next) {
  try {
    const result = await listAdminPayouts("pawapay", req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postInitiateDeposit,
  getDepositStatus,
  postInitiatePayout,
  postRequestPayoutApproval,
  postConfirmPayout,
  postRequestRefundApproval,
  postConfirmRefund,
  getPayoutHistory,
  getPayoutStatus,
  postInitiateRefund,
  getRefundStatus,
  getBalances,
  getConfiguration,
};
