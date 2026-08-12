const { listPaymentLedger } = require("../services/paymentLedger.service");

async function getPaymentLedger(req, res, next) {
  try {
    const result = await listPaymentLedger(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPaymentLedger,
};
