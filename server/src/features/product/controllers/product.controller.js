const {
  createProduct,
  getProductById,
  getProductBySlug,
  listProductsForShop,
  listAllProducts,
  updateProduct,
  setProductStatus,
  adjustStock,
  getStockHistory,
  trackProductView,
} = require("../services/product.service");
const { submitReview } = require("../services/productReview.service");
const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError } = require("../../../common/errors");

async function getSellerProfileIdForUser(userId) {
  const prisma = await getPrismaClient();
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new NotFoundError("Profil vendeur introuvable.");
  return profile.id;
}

function parseImageFiles(files) {
  if (!files) return [];
  return files.map((file, i) => ({ buffer: file.buffer, position: i }));
}

function parseVariants(body) {
  if (!body.variants) return [];
  if (typeof body.variants === "string") {
    try {
      return JSON.parse(body.variants);
    } catch {
      return [];
    }
  }
  return body.variants;
}

async function postCreateProduct(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const product = await createProduct({
      shopId: req.body.shopId,
      sellerProfileId,
      subcategoryId: req.body.subcategoryId,
      name: req.body.name,
      description: req.body.description,
      brand: req.body.brand,
      unit: req.body.unit,
      weightGrams: req.body.weightGrams
        ? Number(req.body.weightGrams)
        : undefined,
      expiresAt: req.body.expiresAt,
      currency: req.body.currency,
      variants: parseVariants(req.body),
      imageBuffers: parseImageFiles(req.files),
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

async function getMyShopProducts(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const prisma = getPrismaClient();
    const shop = await prisma.shop.findUnique({
      where: { id: req.params.shopId },
      select: { id: true, sellerProfileId: true },
    });
    if (!shop || shop.sellerProfileId !== sellerProfileId) {
      throw new NotFoundError("Boutique introuvable.");
    }

    const result = await listProductsForShop(req.params.shopId, {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function putUpdateProduct(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const product = await updateProduct(req.params.id, sellerProfileId, {
      name: req.body.name,
      description: req.body.description,
      brand: req.body.brand,
      unit: req.body.unit,
      weightGrams:
        req.body.weightGrams !== undefined
          ? Number(req.body.weightGrams)
          : undefined,
      expiresAt: req.body.expiresAt,
    });
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

async function postSetProductStatus(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const product = await setProductStatus(
      req.params.id,
      sellerProfileId,
      req.body.status,
    );
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

async function postAdjustStock(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const variant = await adjustStock(req.params.variantId, sellerProfileId, {
      type: req.body.type,
      amount: Number(req.body.amount),
      reason: req.body.reason,
    });
    res.status(200).json({ success: true, data: variant });
  } catch (err) {
    next(err);
  }
}

async function getVariantStockHistory(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const result = await getStockHistory(
      req.params.variantId,
      sellerProfileId,
      {
        page: req.query.page,
        limit: req.query.limit,
      },
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getProducts(req, res, next) {
  try {
    const result = await listAllProducts({
      page: req.query.page,
      limit: req.query.limit,
      categoryId: req.query.categoryId,
      subcategoryId: req.query.subcategoryId,
      shopId: req.query.shopId,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      currency: req.query.currency,
      search: req.query.search,
      inStockOnly: req.query.inStockOnly,
      city: req.query.city,
      sortBy: req.query.sortBy,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getPopularProducts(req, res, next) {
  try {
    const result = await listAllProducts({
      page: req.query.page,
      limit: req.query.limit,
      categoryId: req.query.categoryId,
      shopId: req.query.shopId,
      currency: req.query.currency,
      city: req.query.city,
      sortBy: "popular",
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getProductBySlugHandler(req, res, next) {
  try {
    const product = await getProductBySlug(req.params.slug);
    trackProductView(product.id);
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

async function postSubmitReview(req, res, next) {
  try {
    const review = await submitReview({
      userId: req.user.id,
      productId: req.params.productId,
      rating: req.body.rating,
      comment: req.body.comment,
    });
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postCreateProduct,
  getMyShopProducts,
  putUpdateProduct,
  postSetProductStatus,
  postAdjustStock,
  getVariantStockHistory,
  getProducts,
  getProductBySlugHandler,
  postSubmitReview,
  getPopularProducts,
};
