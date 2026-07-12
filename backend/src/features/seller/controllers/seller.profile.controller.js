const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const sellerProfileService = require("../services/seller.profile.service");

const createSellerProfile = catchAsync(async (req, res) => {
  const { country, businessPhone, businessEmail, acceptedSubMerchantTerms } =
    req.body;

  if (!country) throw errors.badRequest("Le pays est requis.");
  if (acceptedSubMerchantTerms !== true) {
    throw errors.badRequest(
      "Vous devez accepter les conditions vendeur avant de continuer.",
    );
  }

  const sellerProfile = await sellerProfileService.createSellerProfile({
    userId: req.user.id,
    country,
    businessPhone,
    businessEmail,
    acceptedSubMerchantTerms,
  });

  res.status(201).json({
    success: true,
    message: "Profil vendeur créé. Passez maintenant à la vérification KYC.",
    data: { sellerProfile },
  });
});

const getSellerProfile = catchAsync(async (req, res) => {
  const sellerProfile = await sellerProfileService.getSellerProfile({
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    data: { sellerProfile },
  });
});

module.exports = { createSellerProfile, getSellerProfile };
