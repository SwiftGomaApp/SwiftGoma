const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const shopService = require("../services/shop.service");

const parseField = (val) => {
  if (val === undefined || val === null) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

const createShop = catchAsync(async (req, res) => {
  const {
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
  } = req.body;

  const shop = await shopService.createShop({
    userId: req.user.id,
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
    tags: parseField(tags) ?? [],
    workingHours: parseField(workingHours) ?? null,
    socialLinks: parseField(socialLinks) ?? null,
    currency,
    minimumOrderAmount,
    deliveryAvailable,
  });

  res.status(201).json({
    success: true,
    message: "Boutique créée avec succès.",
    data: shop,
  });
});

const updateShop = catchAsync(async (req, res) => {
  const updates = { ...req.body };

  if (updates.tags) updates.tags = parseField(updates.tags);
  if (updates.workingHours)
    updates.workingHours = parseField(updates.workingHours);
  if (updates.socialLinks)
    updates.socialLinks = parseField(updates.socialLinks);

  if (req.files?.logo?.[0]) updates.logo = req.files.logo[0].path;
  if (req.files?.banner?.[0]) updates.banner = req.files.banner[0].path;

  const shop = await shopService.updateShop({
    userId: req.user.id,
    shopId: req.params.id,
    updates,
  });

  res.status(200).json({
    success: true,
    message: "Boutique mise à jour.",
    data: shop,
  });
});

const closeShop = catchAsync(async (req, res) => {
  await shopService.closeShop({ userId: req.user.id, shopId: req.params.id });
  res.status(200).json({ success: true, message: "Boutique fermée." });
});

const listMyShops = catchAsync(async (req, res) => {
  const shops = await shopService.listMyShops({ userId: req.user.id });
  res.status(200).json({ success: true, data: shops });
});

const getMyShop = catchAsync(async (req, res) => {
  const shop = await shopService.getMyShop({
    userId: req.user.id,
    shopId: req.params.id,
  });
  res.status(200).json({ success: true, data: shop });
});

const getShopBySlug = catchAsync(async (req, res) => {
  const shop = await shopService.getShopBySlug(req.params.slug);
  res.status(200).json({ success: true, data: shop });
});

const suspendShop = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const shop = await shopService.suspendShop({ shopId: req.params.id, reason });
  res
    .status(200)
    .json({ success: true, message: "Boutique suspendue.", data: shop });
});

const unsuspendShop = catchAsync(async (req, res) => {
  const shop = await shopService.unsuspendShop({ shopId: req.params.id });
  res
    .status(200)
    .json({ success: true, message: "Boutique réactivée.", data: shop });
});

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
