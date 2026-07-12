const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { validateCountry } = require("../utils/validateCountry");
const { validateEmail } = require("../../../shared/utils/emailValidate.utils");
const { validatePhone } = require("../../../shared/utils/validatePhone.utils");

const SELLER_PROFILE_INCLUDE = {
  kyc: true,
  subscription: { include: { plan: true } },
  shops: true,
};

const createSellerProfile = async ({
  userId,
  country,
  businessPhone = null,
  businessEmail = null,
  acceptedSubMerchantTerms,
}) => {
  const countryResult = validateCountry(country);

  if (!countryResult.valid) {
    throw errors.badRequest(countryResult.message);
  }

  if (!acceptedSubMerchantTerms) {
    throw errors.badRequest(
      "Vous devez accepter les conditions vendeur avant de créer votre profil.",
    );
  }

  let normalizedBusinessPhone = null;
  if (businessPhone) {
    const phoneResult = validatePhone(businessPhone);
    if (!phoneResult.valid) throw errors.badRequest(phoneResult.message);
    normalizedBusinessPhone = phoneResult.phone;
  }

  let normalizedBusinessEmail = null;
  if (businessEmail) {
    const emailResult = validateEmail(businessEmail);
    if (!emailResult.valid) throw errors.badRequest(emailResult.message);
    normalizedBusinessEmail = emailResult.email;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      isDeleted: true,
      isVerified: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();
  if (!user.isVerified) {
    throw errors.badRequest(
      "Votre compte doit être vérifié avant de créer un profil vendeur.",
    );
  }
  if (user.role !== "SELLER") {
    throw errors.badRequest(
      "Seuls les comptes vendeurs peuvent créer un profil vendeur.",
    );
  }

  const existing = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (existing) {
    throw errors.badRequest("Un profil vendeur existe déjà pour ce compte.");
  }

  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId,
      country: countryResult.country,
      businessPhone: normalizedBusinessPhone,
      businessEmail: normalizedBusinessEmail,
      pawapaySubMerchantAgreementAcceptedAt: new Date(),
      onboardingStatus: "PENDING_KYC",
    },
    include: SELLER_PROFILE_INCLUDE,
  });

  return sellerProfile;
};

const getSellerProfile = async ({ userId }) => {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: SELLER_PROFILE_INCLUDE,
  });

  if (!sellerProfile) throw errors.notFound("Profil vendeur");

  return sellerProfile;
};

module.exports = { createSellerProfile, getSellerProfile };