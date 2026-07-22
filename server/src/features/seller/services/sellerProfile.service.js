const { getPrismaClient } = require("../../../config/prisma");
const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require("../../../common/errors");
const {
  uploadImage,
  deleteAsset,
} = require("../../../common/services/cloudinaryUpload");
const {
  CLOUDINARY_FOLDERS,
} = require("../../../common/constants/cloudinaryFolders");
const {
  assertValidProfileInput,
  assertProfileEditable,
  assertValidStatusTransition,
  isValidAddress,
} = require("../utils/sellerProfile.utils");
const { env } = require("../../../config/env");
const {
  sellerProfileStatusEmail,
} = require("../../../common/emails/templates/sellerProfileStatus");
const {
  createNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");
const prisma = getPrismaClient();

async function createSellerProfile({
  userId,
  businessName,
  businessDescription,
  contactPhone,
  contactEmail,
  whatsappNumber,
  address,
  city,
  logoBuffer,
  bannerBuffer,
}) {
  const existing = await prisma.sellerProfile.findUnique({
    where: { userId },
  });
  if (existing) {
    throw new ConflictError("Un profil vendeur existe déjà pour ce compte.");
  }

  // if (!isValidAddress(input.address)) {
  //   throw new ValidationError(
  //     "Adresse invalide (pas de retour à la ligne, 5-200 caractères).",
  //   );
  // }

  if (!logoBuffer || !bannerBuffer) {
    throw new ConflictError("Le logo et la bannière sont requis.");
  }

  const [logo, banner] = await Promise.all([
    uploadImage(logoBuffer, CLOUDINARY_FOLDERS.SELLER_LOGOS),
    uploadImage(bannerBuffer, CLOUDINARY_FOLDERS.SELLER_BANNERS),
  ]);

  const input = {
    businessName,
    businessDescription,
    logoUrl: logo.url,
    bannerUrl: banner.url,
    contactPhone,
    contactEmail,
    whatsappNumber,
    address,
    city,
  };

  try {
    assertValidProfileInput(input);
  } catch (err) {
    await Promise.all([
      deleteAsset(logo.publicId, "image"),
      deleteAsset(banner.publicId, "image"),
    ]);
    throw err;
  }

  const profile = await prisma.sellerProfile.create({
    data: {
      userId,
      ...input,
      logoPublicId: logo.publicId,
      bannerPublicId: banner.publicId,
      status: "DRAFT",
    },
  });

  try {
    const emailContent = sellerProfileStatusEmail({
      name: profile.businessName,
      businessName: profile.businessName,
      action: "created",
      actionUrl: `${env.appUrl}/seller/onboarding`,
      locale: "fr",
    });

    await createNotification({
      userId,
      type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
      title: emailContent.subject,
      body: `Votre profil vendeur pour ${profile.businessName} a été créé. Complétez votre KYC pour l'activer.`,
      data: { action: "sellerProfileCreated", sellerProfileId: profile.id },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error(
      "[seller] Failed to notify seller-profile-created:",
      err.message,
    );
  }

  return profile;
}

async function getSellerProfile(userId) {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError("Profil vendeur introuvable.");
  return profile;
}

async function updateSellerProfile({
  userId,
  businessName,
  businessDescription,
  contactPhone,
  contactEmail,
  whatsappNumber,
  address,
  city,
  logoBuffer,
  bannerBuffer,
}) {
  const profile = await getSellerProfile(userId);
  assertProfileEditable(profile);

  const data = {};
  if (businessName !== undefined) data.businessName = businessName;
  if (businessDescription !== undefined)
    data.businessDescription = businessDescription;
  if (contactPhone !== undefined) data.contactPhone = contactPhone;
  if (contactEmail !== undefined) data.contactEmail = contactEmail;
  if (whatsappNumber !== undefined) data.whatsappNumber = whatsappNumber;
  if (address !== undefined) data.address = address;
  if (city !== undefined) data.city = city;

  let oldLogoPublicId = null;
  let oldBannerPublicId = null;

  if (logoBuffer) {
    const logo = await uploadImage(logoBuffer, CLOUDINARY_FOLDERS.SELLER_LOGOS);
    data.logoUrl = logo.url;
    data.logoPublicId = logo.publicId;
    oldLogoPublicId = profile.logoPublicId;
  }

  if (bannerBuffer) {
    const banner = await uploadImage(
      bannerBuffer,
      CLOUDINARY_FOLDERS.SELLER_BANNERS,
    );
    data.bannerUrl = banner.url;
    data.bannerPublicId = banner.publicId;
    oldBannerPublicId = profile.bannerPublicId;
  }

  assertValidProfileInput({ ...profile, ...data });

  const updated = await prisma.sellerProfile.update({
    where: { userId },
    data,
  });

  if (oldLogoPublicId) await deleteAsset(oldLogoPublicId, "image");
  if (oldBannerPublicId) await deleteAsset(oldBannerPublicId, "image");

  return updated;
}

async function activateSellerProfile(userId) {
  const profile = await getSellerProfile(userId);
  assertValidStatusTransition(profile.status, "ACTIVE");

  const updated = await prisma.sellerProfile.update({
    where: { userId },
    data: { status: "ACTIVE" },
  });

  try {
    const emailContent = sellerProfileStatusEmail({
      name: updated.businessName,
      businessName: updated.businessName,
      action: "activated",
      actionUrl: `${env.appUrl}/seller/dashboard`,
      locale: "fr",
    });

    await createNotification({
      userId,
      type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
      title: emailContent.subject,
      body: `Votre profil vendeur pour ${updated.businessName} est maintenant actif.`,
      data: { action: "sellerProfileActivated" },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error(
      "[seller] Failed to notify seller-profile-activated:",
      err.message,
    );
  }

  return updated;
}

async function suspendSellerProfile(userId, reason) {
  if (!reason || !reason.trim()) {
    throw new ValidationError(
      "Une raison est requise pour suspendre un profil vendeur.",
    );
  }

  const profile = await getSellerProfile(userId);
  assertValidStatusTransition(profile.status, "SUSPENDED");

  const updated = await prisma.sellerProfile.update({
    where: { userId },
    data: { status: "SUSPENDED" },
  });

  try {
    const emailContent = sellerProfileStatusEmail({
      name: updated.businessName,
      businessName: updated.businessName,
      action: "suspended",
      reason,
      actionUrl: `mailto:${require("../../../common/constants/brand").BRAND.supportEmail}`,
      locale: "fr",
    });

    await createNotification({
      userId,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: emailContent.subject,
      body: `Votre profil vendeur a été suspendu. Raison : ${reason}`,
      data: { action: "sellerProfileSuspended" },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error(
      "[seller] Failed to notify seller-profile-suspended:",
      err.message,
    );
  }

  return updated;
}

async function reactivateSellerProfile(userId) {
  const profile = await getSellerProfile(userId);
  assertValidStatusTransition(profile.status, "ACTIVE");

  const updated = await prisma.sellerProfile.update({
    where: { userId },
    data: { status: "ACTIVE" },
  });

  try {
    const emailContent = sellerProfileStatusEmail({
      name: updated.businessName,
      businessName: updated.businessName,
      action: "reactivated",
      actionUrl: `${env.appUrl}/seller/dashboard`,
      locale: "fr",
    });

    await createNotification({
      userId,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: emailContent.subject,
      body: `Votre profil vendeur pour ${updated.businessName} a été réactivé.`,
      data: { action: "sellerProfileReactivated" },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error(
      "[seller] Failed to notify seller-profile-reactivated:",
      err.message,
    );
  }

  return updated;
}

module.exports = {
  createSellerProfile,
  getSellerProfile,
  updateSellerProfile,
  activateSellerProfile,
  suspendSellerProfile,
  reactivateSellerProfile,
};
