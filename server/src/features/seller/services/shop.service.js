const { prisma } = require("../../../config/db.config");
const { cloudinary } = require("../../../config/coudinary.config");
const { errors } = require("../../../shared/errors/app.error");
const notificationService = require("../../notifications/services/notification.service");
const { checkLimit } = require("./subscription.service");

const VALID_CATEGORIES = [
  "ALIMENTATION",
  "RESTAURATION",
  "VETEMENTS",
  "ELECTRONIQUE",
  "BEAUTE",
  "MAISON",
  "AGRICULTURE",
  "PHARMACIE",
  "SERVICES",
  "AUTRE",
];

const VALID_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const generateSlug = async (name) => {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  let slug = base;
  let suffix = 1;

  while (await prisma.shop.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix++;
  }

  return slug;
};

const validateWorkingHours = (hours) => {
  if (!hours || typeof hours !== "object") return;

  for (const day of Object.keys(hours)) {
    if (!VALID_DAYS.includes(day)) {
      throw errors.badRequest(`Jour invalide : ${day}.`);
    }
    const { isOpen, open, close } = hours[day];
    if (isOpen && (!open || !close)) {
      throw errors.badRequest(
        `Heures requises pour ${day} si la boutique est ouverte.`,
      );
    }
    if (open && !/^\d{2}:\d{2}$/.test(open)) {
      throw errors.badRequest(
        `Format d'heure invalide pour ${day} (HH:MM attendu).`,
      );
    }
    if (close && !/^\d{2}:\d{2}$/.test(close)) {
      throw errors.badRequest(
        `Format d'heure invalide pour ${day} (HH:MM attendu).`,
      );
    }
  }
};

const getSellerProfileOrFail = async (userId) => {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { kycRequest: true },
  });
  if (!profile) {
    throw errors.badRequest(
      "Profil vendeur introuvable. Créez votre profil d'abord.",
    );
  }
  return profile;
};

const createShop = async ({
  userId,
  name,
  category,
  commune,
  quartier,
  avenue,
  reference,
  latitude,
  longitude,
  email,
  phone,
  whatsappNumber,
  description,
  tags,
  workingHours,
  currency,
  minimumOrderAmount,
  deliveryAvailable,
  socialLinks,
}) => {
  if (!name?.trim())
    throw errors.badRequest("Le nom de la boutique est requis.");
  if (!category) throw errors.badRequest("La catégorie est requise.");
  if (!commune?.trim()) throw errors.badRequest("La commune est requise.");
  if (!quartier?.trim()) throw errors.badRequest("Le quartier est requis.");
  if (latitude == null) throw errors.badRequest("La latitude est requise.");
  if (longitude == null) throw errors.badRequest("La longitude est requise.");

  if (!VALID_CATEGORIES.includes(category)) {
    throw errors.badRequest(`Catégorie invalide : ${category}.`);
  }

  validateWorkingHours(workingHours);

  const sellerProfile = await getSellerProfileOrFail(userId);

  if (
    !sellerProfile.kycRequest ||
    sellerProfile.kycRequest.status !== "APPROVED"
  ) {
    throw errors.badRequest(
      "Votre KYC doit être approuvé avant de créer une boutique.",
    );
  }

  const { limit, plan } = await checkLimit({ userId, resource: "maxShops" });
  if (limit !== -1) {
    const shopCount = await prisma.shop.count({
      where: { sellerProfileId: sellerProfile.id, status: { not: "CLOSED" } },
    });
    if (shopCount >= limit) {
      throw errors.badRequest(
        `Votre plan ${plan.name} permet ${limit} boutique(s). Passez à un plan supérieur pour en créer d'autres.`,
      );
    }
  }

  const slug = await generateSlug(name.trim());

  const shop = await prisma.shop.create({
    data: {
      sellerProfileId: sellerProfile.id,
      name: name.trim(),
      slug,
      category,
      status: "ACTIVE",
      commune: commune.trim(),
      quartier: quartier.trim(),
      avenue: avenue?.trim() ?? null,
      reference: reference?.trim() ?? null,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      email: email?.trim() ?? null,
      phone: phone?.trim() ?? null,
      whatsappNumber: whatsappNumber?.trim() ?? null,
      description: description?.trim() ?? null,
      tags: Array.isArray(tags) ? tags : [],
      workingHours: workingHours ?? null,
      currency: currency ?? "CDF",
      minimumOrderAmount: minimumOrderAmount
        ? parseInt(minimumOrderAmount)
        : null,
      deliveryAvailable: deliveryAvailable ?? false,
      socialLinks: socialLinks ?? null,
    },
  });

  notificationService
    .send({
      userId,
      type: "ACCOUNT",
      title: "Boutique créée 🎉",
      body: `Votre boutique "${shop.name}" est maintenant active sur SwiftGoma.`,
      data: { shopId: shop.id, shopSlug: shop.slug },
    })
    .catch(() => {});

  return shop;
};

const updateShop = async ({ userId, shopId, updates }) => {
  const shop = await getShopAndVerifyOwner(userId, shopId);

  if (shop.status === "SUSPENDED") {
    throw errors.badRequest(
      "Cette boutique est suspendue. Contactez le support.",
    );
  }

  const {
    description,
    tags,
    email,
    phone,
    whatsappNumber,
    workingHours,
    isTemporarilyClosed,
    closedUntil,
    currency,
    minimumOrderAmount,
    deliveryAvailable,
    socialLinks,
    avenue,
    reference,
    logo,
    banner,
  } = updates;

  validateWorkingHours(workingHours);

  if (logo && shop.logo) {
    const oldId = shop.logo.split("/").slice(-2).join("/").split(".")[0];
    cloudinary.uploader.destroy(oldId).catch(() => {});
  }
  if (banner && shop.banner) {
    const oldId = shop.banner.split("/").slice(-2).join("/").split(".")[0];
    cloudinary.uploader.destroy(oldId).catch(() => {});
  }

  const data = {};
  if (description !== undefined) data.description = description?.trim() ?? null;
  if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : [];
  if (email !== undefined) data.email = email?.trim() ?? null;
  if (phone !== undefined) data.phone = phone?.trim() ?? null;
  if (whatsappNumber !== undefined)
    data.whatsappNumber = whatsappNumber?.trim() ?? null;
  if (avenue !== undefined) data.avenue = avenue?.trim() ?? null;
  if (reference !== undefined) data.reference = reference?.trim() ?? null;
  if (workingHours !== undefined) data.workingHours = workingHours;
  if (isTemporarilyClosed !== undefined)
    data.isTemporarilyClosed = Boolean(isTemporarilyClosed);
  if (closedUntil !== undefined)
    data.closedUntil = closedUntil ? new Date(closedUntil) : null;
  if (currency !== undefined) data.currency = currency;
  if (minimumOrderAmount !== undefined)
    data.minimumOrderAmount = minimumOrderAmount
      ? parseInt(minimumOrderAmount)
      : null;
  if (deliveryAvailable !== undefined)
    data.deliveryAvailable = Boolean(deliveryAvailable);
  if (socialLinks !== undefined) data.socialLinks = socialLinks;
  if (logo !== undefined) data.logo = logo;
  if (banner !== undefined) data.banner = banner;

  return prisma.shop.update({ where: { id: shopId }, data });
};

const closeShop = async ({ userId, shopId }) => {
  const shop = await getShopAndVerifyOwner(userId, shopId);
  if (shop.status === "CLOSED")
    throw errors.badRequest("Cette boutique est déjà fermée.");

  return prisma.shop.update({
    where: { id: shopId },
    data: { status: "CLOSED" },
  });
};

const listMyShops = async ({ userId }) => {
  const sellerProfile = await getSellerProfileOrFail(userId);
  return prisma.shop.findMany({
    where: { sellerProfileId: sellerProfile.id },
    orderBy: { createdAt: "desc" },
  });
};

const getMyShop = async ({ userId, shopId }) => {
  return getShopAndVerifyOwner(userId, shopId);
};

const getShopBySlug = async (slug) => {
  const shop = await prisma.shop.findUnique({
    where: { slug },
    include: {
      sellerProfile: {
        select: { shopName: true, logo: true, userId: true },
      },
    },
  });

  if (!shop || shop.status !== "ACTIVE") {
    throw errors.notFound("Boutique introuvable.");
  }

  return shop;
};

const suspendShop = async ({ shopId, reason }) => {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw errors.notFound("Boutique introuvable.");
  if (shop.status === "SUSPENDED")
    throw errors.badRequest("Boutique déjà suspendue.");

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: {
      status: "SUSPENDED",
      suspendedAt: new Date(),
      suspensionReason: reason ?? null,
    },
  });

  const sellerUserId = (
    await prisma.sellerProfile.findUnique({
      where: { id: shop.sellerProfileId },
      select: { userId: true },
    })
  )?.userId;

  if (sellerUserId) {
    notificationService
      .send({
        userId: sellerUserId,
        type: "ACCOUNT",
        title: "Boutique suspendue",
        body: `Votre boutique "${shop.name}" a été suspendue${reason ? ` : ${reason}` : ""}. Contactez le support.`,
        data: { shopId: shop.id },
      })
      .catch(() => {});
  }

  return updated;
};

const unsuspendShop = async ({ shopId }) => {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw errors.notFound("Boutique introuvable.");
  if (shop.status !== "SUSPENDED")
    throw errors.badRequest("Cette boutique n'est pas suspendue.");

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: {
      status: "ACTIVE",
      suspendedAt: null,
      suspensionReason: null,
    },
  });

  const sellerUserId = (
    await prisma.sellerProfile.findUnique({
      where: { id: shop.sellerProfileId },
      select: { userId: true },
    })
  )?.userId;

  if (sellerUserId) {
    notificationService
      .send({
        userId: sellerUserId,
        type: "ACCOUNT",
        title: "Boutique réactivée",
        body: `Votre boutique "${shop.name}" est à nouveau active sur SwiftGoma.`,
        data: { shopId: shop.id },
      })
      .catch(() => {});
  }

  return updated;
};

const getShopAndVerifyOwner = async (userId, shopId) => {
  const sellerProfile = await getSellerProfileOrFail(userId);
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });

  if (!shop || shop.sellerProfileId !== sellerProfile.id) {
    throw errors.notFound("Boutique introuvable.");
  }

  return shop;
};

module.exports = {
  createShop,
  updateShop,
  closeShop,
  listMyShops,
  getMyShop,
  getShopBySlug,
  suspendShop,
  unsuspendShop,
};
