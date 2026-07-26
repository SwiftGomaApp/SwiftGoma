const {
  initiatePayin,
  initiatePayout,
  checkTransactionStatus,
  getWalletBalances,
  getNetworkBalances,
  getAllCountries,
  getCountries,
} = require("../services/mbioyopay.service");

async function postInitiatePayin(req, res, next) {
  try {
    const result = await initiatePayin({
      amount: req.body.amount,
      currency: req.body.currency,
      network: req.body.network,
      phoneNumber: req.body.phoneNumber,
      countryCode: req.body.countryCode,
      orderId: req.body.orderId,
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

module.exports = {
  postInitiatePayin,
  postInitiatePayout,
  getTransactionStatus,
  getBalances,
  getNetworkBalancesHandler,
  getCountriesHandler,
};
