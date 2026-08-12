const {
  listAdminSubscriptions,
  getAdminSubscriptionById,
} = require("../services/adminSubscription.service");

async function getAdminSubscriptions(req, res, next) {
  try {
    const result = await listAdminSubscriptions(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getAdminSubscription(req, res, next) {
  try {
    const subscription = await getAdminSubscriptionById(req.params.id);
    res.status(200).json({ success: true, data: subscription });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminSubscriptions,
  getAdminSubscription,
};
