const crypto = require("crypto");
const {
  initiatePayin,
  initiatePayout,
  checkTransactionStatus,
  getWalletBalances,
  getNetworkBalances,
  getAllCountries,
  getCountries,
} = require("../services/mbioyopay.service");
const {
  requestMbiyoPayPayoutApproval,
  confirmMbiyoPayPayout,
} = require("../services/adminPayoutApproval.service");
const { listAdminPayouts } = require("../services/adminPayout.service");

const PAYIN_DEDUPE_WINDOW_MS = 5 * 60 * 1000;

function derivePayinOrderId(body) {
  const bucket = Math.floor(Date.now() / PAYIN_DEDUPE_WINDOW_MS);
  const basis = JSON.stringify({
    amount: body.amount,
    currency: body.currency,
    network: body.network,
    phoneNumber: body.phoneNumber,
    countryCode: body.countryCode,
    bucket,
  });
  const hash = crypto.createHash("sha256").update(basis).digest("hex");
  return `SWG-IN-${hash.slice(0, 32)}`;
}

async function postInitiatePayin(req, res, next) {
  try {
    const result = await initiatePayin({
      amount: req.body.amount,
      currency: req.body.currency,
      network: req.body.network,
      phoneNumber: req.body.phoneNumber,
      countryCode: req.body.countryCode,
      orderId: req.body.orderId || derivePayinOrderId(req.body),
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postInitiatePayout(req, res, next) {
  try {
    const result = await initiatePayout({
      amount: req.body.amount,
      currency: req.body.currency,
      network: req.body.network,
      phoneNumber: req.body.phoneNumber,
      countryCode: req.body.countryCode,
      beneficiary: req.body.beneficiary,
      orderId: req.body.orderId,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getTransactionStatus(req, res, next) {
  try {
    const result = await checkTransactionStatus(req.params.transactionId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getBalances(req, res, next) {
  try {
    const result = await getWalletBalances(req.query.currency);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getNetworkBalancesHandler(req, res, next) {
  try {
    const result = await getNetworkBalances({
      currency: req.query.currency,
      countryCode: req.query.countryCode,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postRequestPayoutApproval(req, res, next) {
  try {
    const result = await requestMbiyoPayPayoutApproval(req.user.id, {
      amount: req.body.amount,
      currency: req.body.currency,
      network: req.body.network,
      phoneNumber: req.body.phoneNumber,
      countryCode: req.body.countryCode,
      beneficiary: req.body.beneficiary,
      orderId: req.body.orderId,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postConfirmPayout(req, res, next) {
  try {
    const result = await confirmMbiyoPayPayout(req.user.id, {
      pendingId: req.body.pendingId,
      code: req.body.code,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getCountriesHandler(req, res, next) {
  try {
    const result =
      req.query.all === "true"
        ? await getAllCountries()
        : await getCountries({ page: req.query.page, limit: req.query.limit });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getPayoutHistory(req, res, next) {
  try {
    const result = await listAdminPayouts("mbiyopay", req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postInitiatePayin,
  postInitiatePayout,
  postRequestPayoutApproval,
  postConfirmPayout,
  getPayoutHistory,
  getTransactionStatus,
  getBalances,
  getNetworkBalancesHandler,
  getCountriesHandler,
};
