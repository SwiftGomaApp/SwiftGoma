const { prisma } = require("../../../config/db.config");
const { cloudinary } = require("../../../config/coudinary.config");
const { errors } = require("../../../shared/errors/app.error");
const notificationService = require("../../notifications/services/notification.service");

const getSellerProfile = async ({ userId }) => {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: {
      kycRequest: true,
      shops: true,
      delivererProfiles: true,
    },
  });
  if (!profile) throw errors.notFound("Profil vendeur introuvable.");
  return profile;
};

const createSellerProfile = async ({
  userId,
  shopName,
  description,
  commune,
  quartier,
  avenue,
  logoUrl,
}) => {
  if (!shopName?.trim())
    throw errors.badRequest("Le nom commercial est requis.");
  if (!commune?.trim()) throw errors.badRequest("La commune est requise.");
  if (!quartier?.trim()) throw errors.badRequest("Le quartier est requis.");

  const existing = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (existing) throw errors.badRequest("Vous avez déjà un profil vendeur.");

  const [profile] = await prisma.$transaction([
    prisma.sellerProfile.create({
      data: {
        userId,
        shopName: shopName.trim(),
        description: description?.trim() ?? null,
        commune: commune.trim(),
        quartier: quartier.trim(),
        avenue: avenue?.trim() ?? null,
        logo: logoUrl ?? null,
      },
    }),
  ]);

  await prisma.kycRequest.create({
    data: { sellerProfileId: profile.id },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { role: "SELLER" },
  });

  notificationService
    .send({
      userId,
      type: "KYC",
      title: "Profil vendeur créé",
      body: "Soumettez vos documents KYC (carte d'identité + RCCM) pour commencer à vendre.",
      data: { sellerProfileId: profile.id },
    })
    .catch(() => {});

  return profile;
};

const updateSellerProfile = async ({
  userId,
  shopName,
  description,
  commune,
  quartier,
  avenue,
  logoUrl,
}) => {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!profile) throw errors.notFound("Profil vendeur introuvable.");

  if (logoUrl && profile.logo) {
    const oldId = profile.logo.split("/").slice(-2).join("/").split(".")[0];
    cloudinary.uploader.destroy(oldId).catch(() => {});
  }

  return prisma.sellerProfile.update({
    where: { userId },
    data: {
      ...(shopName !== undefined && { shopName: shopName.trim() }),
      ...(description !== undefined && {
        description: description?.trim() ?? null,
      }),
      ...(commune !== undefined && { commune: commune.trim() }),
      ...(quartier !== undefined && { quartier: quartier.trim() }),
      ...(avenue !== undefined && { avenue: avenue?.trim() ?? null }),
      ...(logoUrl && { logo: logoUrl }),
    },
  });
};

module.exports = {
  getSellerProfile,
  createSellerProfile,
  updateSellerProfile,
};
