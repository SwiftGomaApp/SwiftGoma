const { getPrismaClient } = require("../../../config/prisma");
const {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
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
  assertValidShopLocation,
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
const cache = require("../../../common/services/cache");

const prisma = getPrismaClient();

async function invalidateShopCache(slug) {
  if (slug) await cache.del(`shop:slug:${slug}`);
}

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
  address,
  latitude,
  longitude,
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
  await assertValidShopInput(input);
  assertValidShopLocation({ latitude, longitude });

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
        address,
        latitude,
        longitude,
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
  return cache.getOrSet(`shop:slug:${slug}`, 180, async () => {
    const shop = await prisma.shop.findFirst({
      where: { slug, status: "PUBLISHED", deletedAt: null },
      include: {
        sellerProfile: {
          select: {
            contactPhone: true,
            contactEmail: true,
            whatsappNumber: true,
            city: true,
          },
        },
      },
    });
    if (!shop) throw new NotFoundError("Boutique introuvable.");

    const { getShopRatingSummary } = require("../../product/services/productReview.service");
    const rating = await getShopRatingSummary(shop.id);

    return { ...shop, rating };
  });
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
  if (data.address !== undefined) updateData.address = data.address;
  if (data.latitude !== undefined) updateData.latitude = data.latitude;
  if (data.longitude !== undefined) updateData.longitude = data.longitude;

  // Validate before touching Cloudinary — no point uploading a new
  // logo/banner for a request that was going to be rejected anyway.
  await assertValidShopInput({ ...shop, ...updateData });
  assertValidShopLocation({
    latitude: updateData.latitude,
    longitude: updateData.longitude,
  });

  const oldLogoPublicId = shop.logoPublicId;
  const oldBannerPublicId = shop.bannerPublicId;
  let newLogo = null;
  let newBanner = null;

  try {
    if (data.logoBuffer) {
      newLogo = await uploadImage(data.logoBuffer, CLOUDINARY_FOLDERS.SHOP_LOGOS);
      updateData.logoUrl = newLogo.url;
      updateData.logoPublicId = newLogo.publicId;
    }

    if (data.bannerBuffer) {
      newBanner = await uploadImage(
        data.bannerBuffer,
        CLOUDINARY_FOLDERS.SHOP_BANNERS,
      );
      updateData.bannerUrl = newBanner.url;
      updateData.bannerPublicId = newBanner.publicId;
    }

    const updated = await prisma.shop.update({
      where: { id: shopId },
      data: updateData,
    });

    if (newLogo && oldLogoPublicId) await deleteAsset(oldLogoPublicId, "image");
    if (newBanner && oldBannerPublicId) await deleteAsset(oldBannerPublicId, "image");

    await invalidateShopCache(shop.slug);

    return updated;
  } catch (err) {
    if (newLogo) await deleteAsset(newLogo.publicId, "image");
    if (newBanner) await deleteAsset(newBanner.publicId, "image");
    throw err;
  }
}

async function publishShop(shopId, sellerProfileId) {
  const shop = await getShopById(shopId);
  if (shop.sellerProfileId !== sellerProfileId) {
    throw new NotFoundError("Boutique introuvable.");
  }

  assertValidStatusTransition(shop.status, "PUBLISHED");

  const subscription = await getActiveSubscriptionWithPlan(sellerProfileId);
  assertCanPublish(subscription);

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  await invalidateShopCache(shop.slug);

  return updated;
}

async function unpublishShop(shopId, sellerProfileId) {
  const shop = await getShopById(shopId);
  if (shop.sellerProfileId !== sellerProfileId) {
    throw new NotFoundError("Boutique introuvable.");
  }

  assertValidStatusTransition(shop.status, "DRAFT");

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { status: "DRAFT" },
  });

  await invalidateShopCache(shop.slug);

  return updated;
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

  await invalidateShopCache(shop.slug);

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

  await invalidateShopCache(shop.slug);

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

  await invalidateShopCache(shop.slug);

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

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { status: "PUBLISHED", suspendedBy: null, suspensionReason: null },
  });

  await invalidateShopCache(shop.slug);

  return updated;
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

  await invalidateShopCache(shop.slug);

  if (shop.logoPublicId) await deleteAsset(shop.logoPublicId, "image");
  if (shop.bannerPublicId) await deleteAsset(shop.bannerPublicId, "image");

  try {
    const emailContent = shopStatusEmail({
      name: shop.sellerProfile.businessName,
      action: "suspended",
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

  await invalidateShopCache(shop.slug);

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

async function listPublishedShops({ page = 1, limit = 20, search, city } = {}) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const version = await cache.getVersion("shops");
  const cacheKey = `shops:list:v${version}:${JSON.stringify({ page: safePage, limit: safeLimit, search, city })}`;

  return cache.getOrSet(cacheKey, 180, async () => {
    const where = {
      status: "PUBLISHED",
      deletedAt: null,
      ...(city ? { sellerProfile: { city } } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    };

    const [total, shops] = await Promise.all([
      prisma.shop.count({ where }),
      prisma.shop.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { publishedAt: "desc" },
        include: {
          _count: { select: { products: { where: { status: "PUBLISHED" } } } },
        },
      }),
    ]);

    return {
      shops,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  });
}

async function listAllShops({ page = 1, limit = 20, search, status } = {}) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const VALID_STATUSES = ["DRAFT", "PUBLISHED", "SUSPENDED"];
  if (status && !VALID_STATUSES.includes(status)) {
    throw new BadRequestError("Statut de filtre invalide.");
  }

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, shops] = await Promise.all([
    prisma.shop.count({ where }),
    prisma.shop.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: {
        sellerProfile: { select: { id: true, businessName: true } },
        _count: { select: { products: true } },
      },
    }),
  ]);

  return {
    shops,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
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
  listPublishedShops,
  listAllShops,
  invalidateShopCache,
};
