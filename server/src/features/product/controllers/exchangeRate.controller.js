const {
  createExchangeRate,
  updateExchangeRate,
  upsertExchangeRate,
  getExchangeRateById,
  listExchangeRates,
  deleteExchangeRate,
  previewConversion,
} = require("../services/exchangeRate.service");

async function postCreateExchangeRate(req, res, next) {
  try {
    const rate = await createExchangeRate({
      fromCurrency: req.body.fromCurrency,
      toCurrency: req.body.toCurrency,
      rate: req.body.rate,
      updatedBy: req.user?.id,
    });
    res.status(201).json({ success: true, data: rate });
  } catch (err) {
    next(err);
  }
}

async function putUpdateExchangeRate(req, res, next) {
  try {
    const rate = await updateExchangeRate(req.params.id, {
      rate: req.body.rate,
      updatedBy: req.user?.id,
    });
    res.status(200).json({ success: true, data: rate });
  } catch (err) {
    next(err);
  }
}

async function putUpsertExchangeRate(req, res, next) {
  try {
    const rate = await upsertExchangeRate({
      fromCurrency: req.body.fromCurrency,
      toCurrency: req.body.toCurrency,
      rate: req.body.rate,
      updatedBy: req.user?.id,
    });
    res.status(200).json({ success: true, data: rate });
  } catch (err) {
    next(err);
  }
}

async function getExchangeRateOne(req, res, next) {
  try {
    const rate = await getExchangeRateById(req.params.id);
    res.status(200).json({ success: true, data: rate });
  } catch (err) {
    next(err);
  }
}

async function getExchangeRates(req, res, next) {
  try {
    const rates = await listExchangeRates();
    res.status(200).json({ success: true, data: rates });
  } catch (err) {
    next(err);
  }
}

async function deleteExchangeRateOne(req, res, next) {
  try {
    const result = await deleteExchangeRate(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postPreviewConversion(req, res, next) {
  try {
    const result = await previewConversion({
      amount: req.body.amount,
      fromCurrency: req.body.fromCurrency,
      toCurrency: req.body.toCurrency,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postCreateExchangeRate,
  putUpdateExchangeRate,
  putUpsertExchangeRate,
  getExchangeRateOne,
  getExchangeRates,
  deleteExchangeRateOne,
  postPreviewConversion,
};
