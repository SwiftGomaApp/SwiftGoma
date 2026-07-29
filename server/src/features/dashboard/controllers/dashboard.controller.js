const { getAdminOverview } = require("../services/dashboard.service");

async function getOverview(req, res, next) {
  try {
    const overview = await getAdminOverview();
    res.status(200).json({ success: true, data: overview });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOverview };
