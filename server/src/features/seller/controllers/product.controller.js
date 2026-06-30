const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const productService = require("../services/product.service");

// ─── Parse helper — handles both JSON string and object ──────────────────────

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

const listAllProducts = catchAsync(async (req, res) => {
  const { categoryId, shopId, search, isFeatured, page, limit } = req.query;

  const result = await productService.listAllProducts({
    categoryId: categoryId ?? undefined,
    shopId: shopId ?? undefined,
    search: search ?? undefined,
    isFeatured: isFeatured ?? undefined,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });

  res.status(200).json({ success: true, data: result });
});

// ─── Products ─────────────────────────────────────────────────────────────────

const createProduct = catchAsync(async (req, res) => {
  const { name, description, categoryId, price, priceUsd, stock, tags } =
    req.body;

  const product = await productService.createProduct({
    userId: req.user.id,
    shopId: req.params.shopId,
    name,
    description,
    categoryId: categoryId ?? null,
    price,
    priceUsd: priceUsd ?? null,
    stock: stock ?? 0,
    tags: parseField(tags) ?? [],
  });

  res.status(201).json({
    success: true,
    message:
      "Produit créé. Ajoutez des images et publiez-le pour qu'il soit visible.",
    data: product,
  });
});

const updateProduct = catchAsync(async (req, res) => {
  const updates = { ...req.body };
  if (updates.tags) updates.tags = parseField(updates.tags);

  const product = await productService.updateProduct({
    userId: req.user.id,
    shopId: req.params.shopId,
    productId: req.params.id,
    ...updates,
  });

  res.status(200).json({
    success: true,
    message: "Produit mis à jour.",
    data: product,
  });
});

const archiveProduct = catchAsync(async (req, res) => {
  await productService.archiveProduct({
    userId: req.user.id,
    shopId: req.params.shopId,
    productId: req.params.id,
  });

  res.status(200).json({ success: true, message: "Produit archivé." });
});

const listProducts = catchAsync(async (req, res) => {
  const { status, categoryId, page, limit } = req.query;

  const result = await productService.listProducts({
    shopId: req.params.shopId,
    status: status ?? undefined,
    categoryId: categoryId ?? undefined,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });

  res.status(200).json({ success: true, data: result });
});

const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProduct({
    shopId: req.params.shopId,
    productId: req.params.id,
  });

  res.status(200).json({ success: true, data: product });
});

// ─── Images ───────────────────────────────────────────────────────────────────

const addProductImages = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw errors.badRequest("Au moins une image est requise.");
  }

  const imageUrls = req.files.map((f) => f.path);

  const product = await productService.addProductImages({
    userId: req.user.id,
    shopId: req.params.shopId,
    productId: req.params.id,
    imageUrls,
  });

  res.status(200).json({
    success: true,
    message: `${imageUrls.length} image(s) ajoutée(s).`,
    data: product,
  });
});

const deleteProductImage = catchAsync(async (req, res) => {
  await productService.deleteProductImage({
    userId: req.user.id,
    shopId: req.params.shopId,
    productId: req.params.id,
    imageId: req.params.imageId,
  });

  res.status(200).json({ success: true, message: "Image supprimée." });
});

const setPrimaryImage = catchAsync(async (req, res) => {
  await productService.setPrimaryImage({
    userId: req.user.id,
    shopId: req.params.shopId,
    productId: req.params.id,
    imageId: req.params.imageId,
  });

  res
    .status(200)
    .json({ success: true, message: "Image principale mise à jour." });
});

// ─── Variants ─────────────────────────────────────────────────────────────────

const createVariant = catchAsync(async (req, res) => {
  const { name, options, price, priceUsd, stock, sku } = req.body;

  const variant = await productService.createVariant({
    userId: req.user.id,
    shopId: req.params.shopId,
    productId: req.params.id,
    name,
    options: parseField(options),
    price: price ?? null,
    priceUsd: priceUsd ?? null,
    stock: stock ?? 0,
    sku: sku ?? null,
  });

  res.status(201).json({
    success: true,
    message: "Variant créé.",
    data: variant,
  });
});

const updateVariant = catchAsync(async (req, res) => {
  const { name, options, price, priceUsd, stock, sku } = req.body;

  const variant = await productService.updateVariant({
    userId: req.user.id,
    shopId: req.params.shopId,
    productId: req.params.id,
    variantId: req.params.variantId,
    name,
    options: options ? parseField(options) : undefined,
    price,
    priceUsd,
    stock,
    sku,
  });

  res.status(200).json({
    success: true,
    message: "Variant mis à jour.",
    data: variant,
  });
});

const deleteVariant = catchAsync(async (req, res) => {
  await productService.deleteVariant({
    userId: req.user.id,
    shopId: req.params.shopId,
    productId: req.params.id,
    variantId: req.params.variantId,
  });

  res.status(200).json({ success: true, message: "Variant supprimé." });
});

// ─── Feature toggle ───────────────────────────────────────────────────────────

const toggleFeatured = catchAsync(async (req, res) => {
  const product = await productService.toggleFeatured({
    userId: req.user.id,
    shopId: req.params.shopId,
    productId: req.params.id,
  });

  res.status(200).json({
    success: true,
    message: product.isFeatured
      ? "Produit mis en vedette."
      : "Produit retiré de la vedette.",
    data: product,
  });
});

module.exports = {
  listAllProducts,
  createProduct,
  updateProduct,
  archiveProduct,
  listProducts,
  getProduct,
  addProductImages,
  deleteProductImage,
  setPrimaryImage,
  createVariant,
  updateVariant,
  deleteVariant,
  toggleFeatured,
};
