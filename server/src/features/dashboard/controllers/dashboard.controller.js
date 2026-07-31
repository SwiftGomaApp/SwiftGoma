const {
  getAdminOverview,
  getDashboardMetrics,
} = require("../services/dashboard.service");

async function getOverview(req, res, next) {
  try {
    const overview = await getAdminOverview();
    res.status(200).json({ success: true, data: overview });
  } catch (err) {
    next(err);
  }
}

async function getMetrics(req, res, next) {
  try {
    // getDashboardMetrics() itself clamps invalid values back to safe
    // defaults (30 days, USD) — no need to 400 here, an unexpected
    // query param just falls back rather than erroring.
    const metrics = await getDashboardMetrics({
      days: req.query.days,
      currency: req.query.currency,
    });
    res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOverview, getMetrics };
