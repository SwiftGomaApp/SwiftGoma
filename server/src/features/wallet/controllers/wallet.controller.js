const {
  getWalletOverview,
  listWalletTransactions,
  requestPayoutOtp,
  initiateSellerPayout,
} = require("../services/wallet.service");
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

async function getMyWallet(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const wallet = await getWalletOverview(sellerProfileId);
    res.status(200).json({ success: true, data: wallet });
  } catch (err) {
    next(err);
  }
}

async function getMyWalletTransactions(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const result = await listWalletTransactions(sellerProfileId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postRequestPayoutOtp(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const result = await requestPayoutOtp(sellerProfileId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postInitiatePayout(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const result = await initiateSellerPayout({
      sellerProfileId,
      currency: req.body.currency,
      amount: req.body.amount,
      otpCode: req.body.otpCode,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyWallet,
  getMyWalletTransactions,
  postRequestPayoutOtp,
  postInitiatePayout,
};
