const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError, ConflictError } = require("../../../common/errors");
const {
  isValidName,
  isValidEmail,
  isValidPhone,
  generateVerificationOtp,
  getOtpExpiry,
  hashVerificationCode,
} = require("../../auth/utils/auth");
const { sendOtpLoginEmail } = require("../../../common/emails");
const {
  createNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");

const prisma = getPrismaClient();

const RIDER_INVITE_OTP_TTL_MINUTES = 60 * 24;

async function assertRiderOwnedBySeller(riderId, sellerProfileId) {
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    include: { user: true },
  });
  if (!rider || rider.sellerProfileId !== sellerProfileId || rider.deletedAt) {
    throw new NotFoundError("Livreur introuvable.");
  }
  return rider;
}

async function findRiderForSellerAssignment(sellerProfileId, riderIdOrUserId) {
  if (!riderIdOrUserId || typeof riderIdOrUserId !== "string") {
    throw new ConflictError("Identifiant du livreur requis (riderId).");
  }

  const rider = await prisma.rider.findFirst({
    where: {
      sellerProfileId,
      deletedAt: null,
      OR: [{ id: riderIdOrUserId }, { userId: riderIdOrUserId }],
    },
    include: { user: true },
  });

  if (!rider) {
    throw new NotFoundError(
      "Livreur introuvable pour votre boutique. Vérifiez que vous utilisez le riderId (pas l'identifiant utilisateur) et que ce livreur appartient à votre compte vendeur.",
    );
  }

  return rider;
}

async function listRidersForSeller(sellerProfileId) {
  const riders = await prisma.rider.findMany({
    where: { sellerProfileId, deletedAt: null },
    include: {
      user: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return riders.map((rider) => ({
    id: rider.id,
    userId: rider.userId,
    name: rider.user.name,
    phone: rider.user.phone,
    status: rider.status,
    isAvailable: rider.isAvailable,
    vehicleType: rider.vehicleType,
    createdAt: rider.createdAt,
  }));
}

async function activateRider(riderId, sellerProfileId) {
  const rider = await assertRiderOwnedBySeller(riderId, sellerProfileId);

  if (rider.status === "SUSPENDED") {
    throw new ConflictError(
      "Ce livreur est suspendu. Réactivez-le avant de lui assigner une commande.",
    );
  }

  if (rider.status === "ACTIVE" && rider.isAvailable) {
    return rider;
  }

  return prisma.rider.update({
    where: { id: riderId },
    data: { status: "ACTIVE", isAvailable: true },
    include: { user: true },
  });
}

async function createRiderAccount({
  sellerProfileId,
  name,
  email,
  phone,
  locale = "fr",
}) {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
  });
  if (!sellerProfile) throw new NotFoundError("Profil vendeur introuvable.");
  if (sellerProfile.status !== "ACTIVE") {
    throw new ConflictError(
      "Votre profil vendeur doit être actif pour inviter un livreur.",
    );
  }

  if (!isValidName(name)) {
    throw new ConflictError("Nom invalide.");
  }
  if (!isValidEmail(email)) {
    throw new ConflictError("Adresse e-mail invalide.");
  }
  if (!isValidPhone(phone)) {
    throw new ConflictError("Numéro de téléphone invalide.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingEmail) {
    throw new ConflictError("Un compte existe déjà avec cet e-mail.");
  }

  const code = generateVerificationOtp();
  const codeHash = hashVerificationCode(code);
  const expiresAt = getOtpExpiry(RIDER_INVITE_OTP_TTL_MINUTES);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: name.trim(),
        phone,
        role: "RIDER",
        emails: {
          create: {
            email: normalizedEmail,
            isPrimary: true,
            verificationCode: codeHash,
            verificationCodeExpiresAt: expiresAt,
          },
        },
      },
    });

    const rider = await tx.rider.create({
      data: {
        userId: user.id,
        sellerProfileId,
        status: "PENDING",
      },
    });

    return { user, rider };
  });

  try {
    await sendOtpLoginEmail(normalizedEmail, {
      name: name.trim(),
      code,
      expiresInMinutes: RIDER_INVITE_OTP_TTL_MINUTES,
      locale,
    });
  } catch (err) {
    console.error("[rider] Failed to send invite email:", err.message);
  }

  return {
    userId: result.user.id,
    riderId: result.rider.id,
    status: "PENDING",
  };
}

async function suspendRider(riderId, sellerProfileId, reason) {
  const rider = await assertRiderOwnedBySeller(riderId, sellerProfileId);
  if (rider.status === "SUSPENDED") {
    throw new ConflictError("Ce livreur est déjà suspendu.");
  }

  const updated = await prisma.rider.update({
    where: { id: riderId },
    data: { status: "SUSPENDED", isAvailable: false },
  });

  try {
    await createNotification({
      userId: rider.userId,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: "Votre compte livreur a été suspendu",
      body: reason
        ? `Votre compte livreur a été suspendu par le vendeur. Raison : ${reason}`
        : "Votre compte livreur a été suspendu par le vendeur.",
      data: { action: "riderSuspended" },
    });
  } catch (err) {
    console.error("[rider] Failed to notify suspension:", err.message);
  }

  return updated;
}

async function reactivateRider(riderId, sellerProfileId) {
  const rider = await assertRiderOwnedBySeller(riderId, sellerProfileId);
  if (rider.status !== "SUSPENDED") {
    throw new ConflictError("Ce livreur n'est pas suspendu.");
  }

  const updated = await prisma.rider.update({
    where: { id: riderId },
    data: { status: "ACTIVE" },
  });

  try {
    await createNotification({
      userId: rider.userId,
      type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
      title: "Votre compte livreur a été réactivé",
      body: "Vous pouvez de nouveau accepter des livraisons.",
      data: { action: "riderReactivated" },
    });
  } catch (err) {
    console.error("[rider] Failed to notify reactivation:", err.message);
  }

  return updated;
}

async function deleteRider(riderId, sellerProfileId) {
  const rider = await assertRiderOwnedBySeller(riderId, sellerProfileId);

  const updated = await prisma.rider.update({
    where: { id: riderId },
    data: { status: "SUSPENDED", isAvailable: false, deletedAt: new Date() },
  });

  try {
    await createNotification({
      userId: rider.userId,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: "Votre compte livreur a été retiré",
      body: "Le vendeur a mis fin à votre accès en tant que livreur.",
      data: { action: "riderDeleted" },
    });
  } catch (err) {
    console.error("[rider] Failed to notify deletion:", err.message);
  }

  return updated;
}

async function getRiderDeliveryHistory(riderId, { page = 1, limit = 20 } = {}) {
  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider || rider.deletedAt)
    throw new NotFoundError("Livreur introuvable.");

  return {
    deliveries: [],
    pagination: { page, limit, total: 0, totalPages: 1 },
  };
}

module.exports = {
  createRiderAccount,
  suspendRider,
  reactivateRider,
  deleteRider,
  getRiderDeliveryHistory,
  findRiderForSellerAssignment,
  listRidersForSeller,
  activateRider,
};
