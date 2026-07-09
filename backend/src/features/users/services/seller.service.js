const { prisma } = require("../../../config/db.config");

const { cloudinary } = require("../../../config/coudinary.config");
const { errors } = require("../../../shared/errors/app.error");

const validateSellerFields = ({ commune, quartier }) => {
  if (!commune?.trim()) throw errors.badRequest("La commune est requise.");
  if (!quartier?.trim()) throw errors.badRequest("Le quartier est requis.");
};

// ─── Get profile ──────────────────────────────────────────────────────────────

const getSellerProfile = async ({ userId }) => {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { delivererProfiles: true, shops: true },
  });
  if (!profile) throw errors.badRequest("Aucun profil vendeur trouvé.");
  return profile;
};

// ─── Create seller profile ────────────────────────────────────────────────────

const createSellerProfile = async ({
  userId,
  description,
  commune,
  quartier,
  avenue,
  logoUrl,
}) => {
  validateSellerFields({ commune, quartier });

  const existing = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (existing) throw errors.badRequest("Vous avez déjà un profil vendeur.");

  const profile = await prisma.sellerProfile.create({
    data: {
      userId,
      description: description?.trim() ?? null,
      commune: commune.trim(),
      quartier: quartier.trim(),
      avenue: avenue?.trim() ?? null,
      logo: logoUrl ?? null,
      kycStatus: "PENDING",
    },
  });

  // Set user role to SELLER
  await prisma.user.update({
    where: { id: userId },
    data: { role: "SELLER" },
  });

  return profile;
};

// ─── Update seller profile ────────────────────────────────────────────────────

const updateSellerProfile = async ({
  userId,
  description,
  commune,
  quartier,
  avenue,
  logoUrl,
}) => {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!profile) throw errors.badRequest("Aucun profil vendeur trouvé.");

  if (profile.isApproved) {
    throw errors.badRequest(
      "Votre profil est approuvé. Contactez le support pour modifier les informations.",
    );
  }

  // Delete old logo from Cloudinary if replacing
  if (logoUrl && profile.logo) {
    const oldPublicId = profile.logo
      .split("/")
      .slice(-2)
      .join("/")
      .split(".")[0];
    await cloudinary.uploader.destroy(oldPublicId).catch(() => {});
  }

  return prisma.sellerProfile.update({
    where: { userId },
    data: {
      ...(description !== undefined && {
        description: description?.trim() ?? null,
      }),
      ...(commune && { commune: commune.trim() }),
      ...(quartier && { quartier: quartier.trim() }),
      ...(avenue !== undefined && { avenue: avenue?.trim() ?? null }),
      ...(logoUrl && { logo: logoUrl }),
    },
  });
};

const submitKyc = async ({ userId, documentUrls }) => {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!profile) throw errors.badRequest("Aucun profil vendeur trouvé.");

  if (profile.kycStatus === "APPROVED") {
    throw errors.badRequest("Votre KYC est déjà approuvé.");
  }

  if (!documentUrls || documentUrls.length === 0) {
    throw errors.badRequest("Au moins un document est requis.");
  }

  return prisma.sellerProfile.update({
    where: { userId },
    data: {
      kycDocuments: documentUrls,
      kycStatus: "SUBMITTED",
      kycNote: null,
    },
  });
};

module.exports = {
  getSellerProfile,
  createSellerProfile,
  updateSellerProfile,
  submitKyc,
};
