const {
  getInvoiceForDownload,
  listInvoicesForSeller,
  getInvoiceStats,
} = require("../services/invoice.service");
const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError } = require("../../../common/errors");

async function getSellerProfileIdForUser(userId) {
  const prisma = getPrismaClient();
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new NotFoundError("Profil vendeur introuvable.");
  return profile.id;
}

async function getMyInvoices(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const result = await listInvoicesForSeller(sellerProfileId, {
      page: req.query.page,
      limit: req.query.limit,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function downloadMyInvoice(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const invoice = await getInvoiceForDownload(req.params.id, sellerProfileId);
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

async function getInvoiceStatsHandler(req, res, next) {
  try {
    const stats = await getInvoiceStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyInvoices,
  downloadMyInvoice,
  getInvoiceStatsHandler,
};
