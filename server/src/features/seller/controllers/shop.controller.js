const {
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
} = require("../services/shop.service");
const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError } = require("../../../common/errors");

async function getSellerProfileIdForUser(userId) {
  const prisma = getPrismaClient();
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new NotFoundError("Profil vendeur introuvable.");
  return profile.id;
}

// -----------------------------
// VENDEUR (authentifié)
// -----------------------------

async function postCreateShop(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const shop = await createShop({
      sellerProfileId,
      name: req.body.name,
      description: req.body.description,
      deliveryFee: req.body.deliveryFee,
      deliveryFeeCurrency: req.body.deliveryFeeCurrency,
      logoBuffer: req.files?.logo?.[0]?.buffer,
      bannerBuffer: req.files?.banner?.[0]?.buffer,
    });
    res.status(201).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
}

async function getMyShops(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const shops = await listShopsForSeller(sellerProfileId);
    res.status(200).json({ success: true, data: shops });
  } catch (err) {
    next(err);
  }
}

async function putUpdateShop(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const shop = await updateShop(req.params.id, sellerProfileId, {
      name: req.body.name,
      description: req.body.description,
      deliveryFee: req.body.deliveryFee,
      deliveryFeeCurrency: req.body.deliveryFeeCurrency,
      logoBuffer: req.files?.logo?.[0]?.buffer,
      bannerBuffer: req.files?.banner?.[0]?.buffer,
    });
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
}

async function postPublishShop(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const shop = await publishShop(req.params.id, sellerProfileId);
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
}

async function postUnpublishShop(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const shop = await unpublishShop(req.params.id, sellerProfileId);
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
}

// Vendeur suspend/réactive/supprime sa PROPRE boutique
async function postSuspendMyShop(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const shop = await suspendMyShop(
      req.params.id,
      sellerProfileId,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
}

async function postReactivateMyShop(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const shop = await reactivateMyShop(req.params.id, sellerProfileId);
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
}

async function deleteMyShop(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const shop = await deleteShop(req.params.id, sellerProfileId);
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
}

// -----------------------------
// PUBLIC (page vitrine, pas d'auth)
// -----------------------------

async function getShopBySlugHandler(req, res, next) {
  try {
    const shop = await getShopBySlug(req.params.slug);
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
}

// -----------------------------
// ADMIN
// -----------------------------

async function postSuspendShop(req, res, next) {
  try {
    const shop = await suspendShop(req.params.id, req.body.reason);
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
}

async function postReactivateShop(req, res, next) {
  try {
    const shop = await reactivateShop(req.params.id);
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
}

async function postAdminDeleteShop(req, res, next) {
  try {
    const shop = await adminDeleteShop(req.params.id, req.body.reason);
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
}

async function postRestoreShop(req, res, next) {
  try {
    const shop = await restoreShop(req.params.id);
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postCreateShop,
  getMyShops,
  putUpdateShop,
  postPublishShop,
  postUnpublishShop,
  postSuspendMyShop,
  postReactivateMyShop,
  deleteMyShop,
  getShopBySlugHandler,
  postSuspendShop,
  postReactivateShop,
  postAdminDeleteShop,
  postRestoreShop,
};
