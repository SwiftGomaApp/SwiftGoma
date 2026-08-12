const { listAdminPayouts } = require("../services/adminPayout.service");

async function getAdminTransactions(req, res, next) {
  try {
    const provider = req.query.provider?.trim() || null;
    const result = await listAdminPayouts(provider, {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      search: req.query.search,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminTransactions,
};
