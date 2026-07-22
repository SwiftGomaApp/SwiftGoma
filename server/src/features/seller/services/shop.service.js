const { getPrismaClient } = require("../../../config/prisma");
const {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} = require("../../../common/errors");
const {
  uploadImage,
  deleteAsset,
} = require("../../../common/services/cloudinaryUpload");
const {
  CLOUDINARY_FOLDERS,
} = require("../../../common/constants/cloudinaryFolders");
const {
  generateSlug,
  assertValidShopInput,
  assertValidStatusTransition,
  assertCanPublish,
  assertCanCreateShop,
  assertCanReactivate,
  assertCanDelete,
} = require("../utils/shop.utils");
const { env } = require("../../../config/env");
const {
  shopStatusEmail,
} = require("../../../common/emails/templates/shopStatus");
const {
  createNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");

const prisma = getPrismaClient();

async function assertSellerProfileExists(sellerProfileId) {
  const profile = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
  });
  if (!profile) throw new NotFoundError("Profil vendeur introuvable.");
  return profile;
}

async function getActiveSubscriptionWithPlan(sellerProfileId) {
  return prisma.subscription.findUnique({
    where: { sellerProfileId },
    include: { plan: true },
  });
}

async function generateUniqueSlug(name) {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.shop.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

async function createShop({
  sellerProfileId,
  name,
  description,
  deliveryFee,
  deliveryFeeCurrency,
  logoBuffer,
  bannerBuffer,
}) {
  await assertSellerProfileExists(sellerProfileId);

  const subscription = await getActiveSubscriptionWithPlan(sellerProfileId);
  if (!subscription || subscription.status !== "ACTIVE") {
    throw new ConflictError(
      "Un abonnement actif est requis pour créer une boutique.",
    );
  }

  const currentShopCount = await prisma.shop.count({
    where: { sellerProfileId, deletedAt: null },
  });
  assertCanCreateShop(
    currentShopCount,
    subscription.plan.maxShops,
    subscription.plan.name,
  );

  const input = { name, description, deliveryFee, deliveryFeeCurrency };
  assertValidShopInput(input);

  if (!logoBuffer || !bannerBuffer) {
    throw new ConflictError("Le logo et la bannière sont requis.");
  }

  const [logo, banner] = await Promise.all([
    uploadImage(logoBuffer, CLOUDINARY_FOLDERS.SHOP_LOGOS),
    uploadImage(bannerBuffer, CLOUDINARY_FOLDERS.SHOP_BANNERS),
  ]);

  const slug = await generateUniqueSlug(name);

  try {
    return await prisma.shop.create({
      data: {
        sellerProfileId,
        name: name.trim(),
        slug,
        description,
        logoUrl: logo.url,
        logoPublicId: logo.publicId,
        bannerUrl: banner.url,
        bannerPublicId: banner.publicId,
        deliveryFee,
        deliveryFeeCurrency,
        status: "DRAFT",
      },
    });
  } catch (err) {
    await Promise.all([
      deleteAsset(logo.publicId, "image"),
      deleteAsset(banner.publicId, "image"),
    ]);
    throw err;
  }
}

async function getShopById(shopId) {
  const shop = await prisma.shop.findFirst({
    where: { id: shopId, deletedAt: null },
  });
  if (!shop) throw new NotFoundError("Boutique introuvable.");
  return shop;
}

async function getShopBySlug(slug) {
  const shop = await prisma.shop.findFirst({
    where: { slug, deletedAt: null },
  });
  if (!shop) throw new NotFoundError("Boutique introuvable.");
  return shop;
}

async function listShopsForSeller(sellerProfileId) {
  return prisma.shop.findMany({
    where: { sellerProfileId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

async function updateShop(shopId, sellerProfileId, data) {
  const shop = await getShopById(shopId);
  if (shop.sellerProfileId !== sellerProfileId) {
    throw new NotFoundError("Boutique introuvable.");
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.deliveryFee !== undefined) updateData.deliveryFee = data.deliveryFee;
  if (data.deliveryFeeCurrency !== undefined) {
    updateData.deliveryFeeCurrency = data.deliveryFeeCurrency;
  }

  let oldLogoPublicId = null;
  let oldBannerPublicId = null;

  if (data.logoBuffer) {
    const logo = await uploadImage(
      data.logoBuffer,
      CLOUDINARY_FOLDERS.SHOP_LOGOS,
    );
    updateData.logoUrl = logo.url;
    updateData.logoPublicId = logo.publicId;
    oldLogoPublicId = shop.logoPublicId;
  }

  if (data.bannerBuffer) {
    const banner = await uploadImage(
      data.bannerBuffer,
      CLOUDINARY_FOLDERS.SHOP_BANNERS,
    );
    updateData.bannerUrl = banner.url;
    updateData.bannerPublicId = banner.publicId;
    oldBannerPublicId = shop.bannerPublicId;
  }

  assertValidShopInput({ ...shop, ...updateData });

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: updateData,
  });

  if (oldLogoPublicId) await deleteAsset(oldLogoPublicId, "image");
  if (oldBannerPublicId) await deleteAsset(oldBannerPublicId, "image");

  return updated;
}

async function publishShop(shopId, sellerProfileId) {
  const shop = await getShopById(shopId);
  if (shop.sellerProfileId !== sellerProfileId) {
    throw new NotFoundError("Boutique introuvable.");
  }

  assertValidStatusTransition(shop.status, "PUBLISHED");

  const subscription = await getActiveSubscriptionWithPlan(sellerProfileId);
  assertCanPublish(subscription);

  return prisma.shop.update({
    where: { id: shopId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}

async function unpublishShop(shopId, sellerProfileId) {
  const shop = await getShopById(shopId);
  if (shop.sellerProfileId !== sellerProfileId) {
    throw new NotFoundError("Boutique introuvable.");
  }

  assertValidStatusTransition(shop.status, "DRAFT");

  return prisma.shop.update({
    where: { id: shopId },
    data: { status: "DRAFT" },
  });
}

async function suspendShop(shopId, reason) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { sellerProfile: { include: { user: true } } },
  });
  if (!shop) throw new NotFoundError("Boutique introuvable.");

  assertValidStatusTransition(shop.status, "SUSPENDED");

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: {
      status: "SUSPENDED",
      suspendedBy: "ADMIN",
      suspensionReason: reason || null,
    },
  });

  try {
    const emailContent = shopStatusEmail({
      name: shop.sellerProfile.businessName,
      action: "suspended",
      shopName: shop.name,
      reason,
      actionUrl: `mailto:${require("../../../common/constants/brand").BRAND.supportEmail}`,
      locale: "fr",
    });

    await createNotification({
      userId: shop.sellerProfile.user.id,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: emailContent.subject,
      body: reason
        ? `Votre boutique ${shop.name} a été suspendue. Raison : ${reason}`
        : `Votre boutique ${shop.name} a été suspendue par notre équipe.`,
      data: { action: "shopSuspended", shopId },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[shop] Failed to notify shop-suspended:", err.message);
  }

  return updated;
}

async function reactivateShop(shopId) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { sellerProfile: { include: { user: true } } },
  });
  if (!shop) throw new NotFoundError("Boutique introuvable.");

  assertValidStatusTransition(shop.status, "PUBLISHED");

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { status: "PUBLISHED" },
  });

  try {
    const emailContent = shopStatusEmail({
      name: shop.sellerProfile.businessName,
      action: "reactivated",
      shopName: shop.name,
      actionUrl: `${env.appUrl}/seller/shop`,
      locale: "fr",
    });

    await createNotification({
      userId: shop.sellerProfile.user.id,
      type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
      title: emailContent.subject,
      body: `Votre boutique ${shop.name} a été réactivée.`,
      data: { action: "shopReactivated", shopId },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[shop] Failed to notify shop-reactivated:", err.message);
  }

  return updated;
}

async function suspendMyShop(shopId, sellerProfileId, reason) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { sellerProfile: { include: { user: true } } },
  });
  if (!shop || shop.sellerProfileId !== sellerProfileId) {
    throw new NotFoundError("Boutique introuvable.");
  }

  assertValidStatusTransition(shop.status, "SUSPENDED");

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: {
      status: "SUSPENDED",
      suspendedBy: "SELLER",
      suspensionReason: reason || null,
    },
  });

  try {
    const emailContent = shopStatusEmail({
      name: shop.sellerProfile.businessName,
      action: "suspended",
      shopName: shop.name,
      reason,
      actionUrl: `${env.appUrl}/seller/shop`,
      locale: "fr",
    });

    await createNotification({
      userId: shop.sellerProfile.user.id,
      type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
      title: emailContent.subject,
      body: `Vous avez suspendu votre boutique ${shop.name}.`,
      data: { action: "shopSuspendedBySeller", shopId },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[shop] Failed to notify self-suspension:", err.message);
  }

  return updated;
}

async function reactivateMyShop(shopId, sellerProfileId) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { sellerProfile: { include: { user: true } } },
  });
  if (!shop || shop.sellerProfileId !== sellerProfileId) {
    throw new NotFoundError("Boutique introuvable.");
  }

  assertValidStatusTransition(shop.status, "PUBLISHED");
  assertCanReactivate(shop, "SELLER");

  const subscription = await getActiveSubscriptionWithPlan(sellerProfileId);
  assertCanPublish(subscription);

  return prisma.shop.update({
    where: { id: shopId },
    data: { status: "PUBLISHED", suspendedBy: null, suspensionReason: null },
  });
}

async function deleteShop(shopId, sellerProfileId) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { sellerProfile: { include: { user: true } } },
  });
  if (!shop || shop.sellerProfileId !== sellerProfileId) {
    throw new NotFoundError("Boutique introuvable.");
  }
  if (shop.deletedAt) {
    throw new ConflictError("Cette boutique est déjà supprimée.");
  }

  assertCanDelete(shop);

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { deletedAt: new Date() },
  });

  if (shop.logoPublicId) await deleteAsset(shop.logoPublicId, "image");
  if (shop.bannerPublicId) await deleteAsset(shop.bannerPublicId, "image");

  try {
    const emailContent = shopStatusEmail({
      name: shop.sellerProfile.businessName,
      action: "suspended", // pas d'action "deleted" dédiée pour l'instant, voir remarque
      shopName: shop.name,
      reason: "Boutique supprimée à votre demande.",
      actionUrl: `${env.appUrl}/seller/shop`,
      locale: "fr",
    });

    await createNotification({
      userId: shop.sellerProfile.user.id,
      type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
      title: "Boutique supprimée",
      body: `Votre boutique ${shop.name} a été supprimée.`,
      data: { action: "shopDeleted", shopId },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[shop] Failed to notify shop-deletion:", err.message);
  }

  return updated;
}

async function adminDeleteShop(shopId, reason) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { sellerProfile: { include: { user: true } } },
  });
  if (!shop) throw new NotFoundError("Boutique introuvable.");
  if (shop.deletedAt) {
    throw new ConflictError("Cette boutique est déjà supprimée.");
  }

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: {
      deletedAt: new Date(),
      slug: `${shop.slug}-deleted-${Date.now()}`,
    },
  });

  if (shop.logoPublicId) await deleteAsset(shop.logoPublicId, "image");
  if (shop.bannerPublicId) await deleteAsset(shop.bannerPublicId, "image");

  try {
    const emailContent = shopStatusEmail({
      name: shop.sellerProfile.businessName,
      action: "suspended",
      shopName: shop.name,
      reason: reason || "Boutique supprimée par notre équipe.",
      actionUrl: `mailto:${require("../../../common/constants/brand").BRAND.supportEmail}`,
      locale: "fr",
    });

    await createNotification({
      userId: shop.sellerProfile.user.id,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: "Boutique supprimée",
      body: reason
        ? `Votre boutique ${shop.name} a été supprimée. Raison : ${reason}`
        : `Votre boutique ${shop.name} a été supprimée par notre équipe.`,
      data: { action: "shopDeletedByAdmin", shopId },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[shop] Failed to notify admin-deletion:", err.message);
  }

  return updated;
}

async function restoreShop(shopId) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { sellerProfile: { include: { user: true } } },
  });
  if (!shop) throw new NotFoundError("Boutique introuvable.");
  if (!shop.deletedAt) {
    throw new ConflictError("Cette boutique n'est pas supprimée.");
  }

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { deletedAt: null, status: "DRAFT" },
  });

  try {
    const emailContent = shopStatusEmail({
      name: shop.sellerProfile.businessName,
      action: "reactivated",
      shopName: shop.name,
      actionUrl: `${env.appUrl}/seller/shop`,
      locale: "fr",
    });

    await createNotification({
      userId: shop.sellerProfile.user.id,
      type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
      title: "Boutique restaurée",
      body: `Votre boutique ${shop.name} a été restaurée. Elle est en brouillon — republiez-la quand vous êtes prêt.`,
      data: { action: "shopRestored", shopId },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[shop] Failed to notify shop-restoration:", err.message);
  }

  return updated;
}

module.exports = {
  createShop,
  getShopById,
  getShopBySlug,
  listShopsForSeller,
  updateShop,
  publishShop,
  unpublishShop,
  suspendShop,
  reactivateShop,
  suspendMyShop,
  reactivateMyShop,
  deleteShop,
  adminDeleteShop,
  restoreShop,
};
