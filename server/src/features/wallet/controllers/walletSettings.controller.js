const {
  createWalletSettings,
  getWalletSettings,
  updateWalletSettings,
} = require("../services/walletSettings.service");
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

async function postCreateWalletSettings(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const settings = await createWalletSettings({
      sellerProfileId,
      payoutPhoneNumber: req.body.payoutPhoneNumber,
      payoutProvider: req.body.payoutProvider,
      payoutCountry: req.body.payoutCountry,
      autoPayoutEnabled: req.body.autoPayoutEnabled,
      payoutSchedule: req.body.payoutSchedule,
      minimumPayoutAmounts: req.body.minimumPayoutAmounts,
    });
    res.status(201).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

async function getMyWalletSettings(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const settings = await getWalletSettings(sellerProfileId);
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

async function putUpdateWalletSettings(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const settings = await updateWalletSettings(sellerProfileId, {
      payoutPhoneNumber: req.body.payoutPhoneNumber,
      payoutProvider: req.body.payoutProvider,
      payoutCountry: req.body.payoutCountry,
      autoPayoutEnabled: req.body.autoPayoutEnabled,
      payoutSchedule: req.body.payoutSchedule,
      minimumPayoutAmounts: req.body.minimumPayoutAmounts,
    });
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postCreateWalletSettings,
  getMyWalletSettings,
  putUpdateWalletSettings,
};
