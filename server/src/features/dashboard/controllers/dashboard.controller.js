const {
  getAdminOverview,
  getDashboardMetrics,
  getSupportOverview,
  getSupportMetrics,
  getAccountantOverview,
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
    const metrics = await getDashboardMetrics({
      days: req.query.days,
      currency: req.query.currency,
    });
    res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
}

async function getSupportOverviewHandler(req, res, next) {
  try {
    const overview = await getSupportOverview();
    res.status(200).json({ success: true, data: overview });
  } catch (err) {
    next(err);
  }
}

async function getSupportMetricsHandler(req, res, next) {
  try {
    const metrics = await getSupportMetrics({ days: req.query.days });
    res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
}

async function getAccountantOverviewHandler(req, res, next) {
  try {
    const overview = await getAccountantOverview();
    res.status(200).json({ success: true, data: overview });
  } catch (err) {
    next(err);
  }
}

async function getAccountantMetricsHandler(req, res, next) {
  try {
    const metrics = await getAccountantMetrics(req.query);
    res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverview,
  getMetrics,
  getSupportOverviewHandler,
  getSupportMetricsHandler,
  getAccountantOverviewHandler,
  getAccountantMetricsHandler,
};
