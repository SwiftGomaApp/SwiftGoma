const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");

const VALID_VEHICLE_TYPES = ["MOTO", "VELO", "PIED", "VOITURE"];

const getDelivererProfile = async ({ userId }) => {
  const profile = await prisma.delivererProfile.findUnique({
    where: { userId },
    include: {
      sellerProfile: { select: { shopName: true, isApproved: true } },
    },
  });

  if (!profile) throw errors.badRequest("Aucun profil livreur trouvé.");
  return profile;
};

const createDelivererProfile = async ({
  userId,
  sellerProfileId,
  zone,
  vehicleType,
}) => {
  if (!zone?.trim())
    throw errors.badRequest("La zone de livraison est requise.");
  if (!vehicleType || !VALID_VEHICLE_TYPES.includes(vehicleType)) {
    throw errors.badRequest(
      `Type de véhicule invalide. Valeurs : ${VALID_VEHICLE_TYPES.join(", ")}.`,
    );
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
  });

  if (!sellerProfile) {
    throw errors.badRequest("Profil vendeur introuvable.");
  }

  if (!sellerProfile.isApproved) {
    throw errors.badRequest(
      "La boutique associée doit être approuvée avant d'ajouter un livreur.",
    );
  }

  const existing = await prisma.delivererProfile.findUnique({
    where: { userId },
  });
  if (existing) {
    throw errors.badRequest("Vous avez déjà un profil livreur.");
  }

  const profile = await prisma.delivererProfile.create({
    data: {
      userId,
      sellerProfileId,
      zone: zone.trim(),
      vehicleType,
      isAvailable: false,
    },
  });

  // Bump role to DELIVERER
  await prisma.user.update({
    where: { id: userId },
    data: { role: "DELIVERER" },
  });

  return profile;
};

const updateDelivererProfile = async ({
  userId,
  zone,
  vehicleType,
  isAvailable,
}) => {
  const profile = await prisma.delivererProfile.findUnique({
    where: { userId },
  });
  if (!profile) throw errors.badRequest("Aucun profil livreur trouvé.");

  if (vehicleType && !VALID_VEHICLE_TYPES.includes(vehicleType)) {
    throw errors.badRequest(
      `Type de véhicule invalide. Valeurs : ${VALID_VEHICLE_TYPES.join(", ")}.`,
    );
  }

  return prisma.delivererProfile.update({
    where: { userId },
    data: {
      ...(zone && { zone: zone.trim() }),
      ...(vehicleType && { vehicleType }),
      ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
    },
  });
};

module.exports = {
  getDelivererProfile,
  createDelivererProfile,
  updateDelivererProfile,
};
