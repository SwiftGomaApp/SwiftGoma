const {
  listInvoicesForAdmin,
  getInvoiceForAdminDownload,
} = require("../services/invoice.service");

async function getAdminInvoices(req, res, next) {
  try {
    const result = await listInvoicesForAdmin(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getAdminInvoiceDownload(req, res, next) {
  try {
    const invoice = await getInvoiceForAdminDownload(req.params.id);
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminInvoices,
  getAdminInvoiceDownload,
};
