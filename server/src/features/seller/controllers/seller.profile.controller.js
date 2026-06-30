const { catchAsync } = require("../../../shared/utils/catchAsync");
const sellerProfileService = require("../services/seller.profile.service");

const getSellerProfile = catchAsync(async (req, res) => {
  const profile = await sellerProfileService.getSellerProfile({
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: profile });
});

const createSellerProfile = catchAsync(async (req, res) => {
  const { shopName, description, commune, quartier, avenue } = req.body;

  const profile = await sellerProfileService.createSellerProfile({
    userId: req.user.id,
    shopName,
    description,
    commune,
    quartier,
    avenue,
    logoUrl: req.file?.path ?? null,
  });

  res.status(201).json({
    success: true,
    message:
      "Profil vendeur créé. Soumettez vos documents KYC pour commencer à vendre.",
    data: profile,
  });
});

const updateSellerProfile = catchAsync(async (req, res) => {
  const { shopName, description, commune, quartier, avenue } = req.body;

  const profile = await sellerProfileService.updateSellerProfile({
    userId: req.user.id,
    shopName,
    description,
    commune,
    quartier,
    avenue,
    logoUrl: req.file?.path ?? null,
  });

  res.status(200).json({
    success: true,
    message: "Profil vendeur mis à jour.",
    data: profile,
  });
});

module.exports = { getSellerProfile, createSellerProfile, updateSellerProfile };
