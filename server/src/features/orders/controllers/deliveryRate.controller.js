const {
  getDeliveryRateConfig,
  upsertDeliveryRateConfig,
} = require("../services/deliveryRate.service");

async function getDeliveryRate(req, res, next) {
  try {
    const config = await getDeliveryRateConfig();
    res.status(200).json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
}

async function putDeliveryRate(req, res, next) {
  try {
    const config = await upsertDeliveryRateConfig({
      perKmRate: req.body.perKmRate,
      updatedBy: req.user?.id,
    });
    res.status(200).json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDeliveryRate, putDeliveryRate };
