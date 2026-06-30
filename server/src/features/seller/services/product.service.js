const { prisma } = require("../../../config/db.config");
const { cloudinary } = require("../../../config/coudinary.config");
const { errors } = require("../../../shared/errors/app.error");
const { checkLimit } = require("./subscription.service");

// ─── Slug generator ───────────────────────────────────────────────────────────

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

  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix++;
  }

  return slug;
};

// ─── Verify shop ownership ────────────────────────────────────────────────────

const getShopAndVerifyOwner = async (userId, shopId) => {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
  });
  if (!sellerProfile) throw errors.badRequest("Profil vendeur introuvable.");

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop || shop.sellerProfileId !== sellerProfile.id) {
    throw errors.notFound("Boutique introuvable.");
  }
  if (shop.status === "SUSPENDED") {
    throw errors.badRequest("Cette boutique est suspendue.");
  }

  return { shop, sellerProfile };
};

// ─── Verify product ownership ─────────────────────────────────────────────────

const getProductAndVerifyOwner = async (userId, shopId, productId) => {
  const { shop } = await getShopAndVerifyOwner(userId, shopId);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true, variants: true },
  });

  if (!product || product.shopId !== shop.id) {
    throw errors.notFound("Produit introuvable.");
  }

  return product;
};

// ─── Create product ───────────────────────────────────────────────────────────

const createProduct = async ({
  userId,
  shopId,
  name,
  description,
  categoryId,
  price,
  priceUsd,
  stock,
  tags,
}) => {
  if (!name?.trim()) throw errors.badRequest("Le nom du produit est requis.");
  if (!price) throw errors.badRequest("Le prix est requis.");

  await getShopAndVerifyOwner(userId, shopId);

  // Check plan limit: maxProducts
  const { limit, plan } = await checkLimit({ userId, resource: "maxProducts" });
  if (limit !== -1) {
    const count = await prisma.product.count({
      where: { shopId, status: { not: "ARCHIVED" } },
    });
    if (count >= limit) {
      throw errors.badRequest(
        `Votre plan ${plan.name} permet ${limit} produit(s) par boutique. Archivez un produit ou passez à un plan supérieur.`,
      );
    }
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category || category.status !== "APPROVED") {
      throw errors.badRequest("Catégorie invalide ou non approuvée.");
    }
  }

  const slug = await generateSlug(name.trim());

  return prisma.product.create({
    data: {
      shopId,
      categoryId: categoryId ?? null,
      name: name.trim(),
      slug,
      description: description?.trim() ?? null,
      price: parseInt(price),
      priceUsd: priceUsd ? parseFloat(priceUsd) : null,
      stock: stock ? parseInt(stock) : 0,
      tags: Array.isArray(tags) ? tags : [],
      status: "DRAFT",
    },
    include: { images: true, variants: true, category: true },
  });
};

// ─── Update product ───────────────────────────────────────────────────────────

const updateProduct = async ({
  userId,
  shopId,
  productId,
  name,
  description,
  categoryId,
  price,
  priceUsd,
  stock,
  tags,
  status,
}) => {
  const product = await getProductAndVerifyOwner(userId, shopId, productId);

  if (product.status === "ARCHIVED") {
    throw errors.badRequest("Ce produit est archivé. Désarchivez-le d'abord.");
  }

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category || category.status !== "APPROVED") {
      throw errors.badRequest("Catégorie invalide ou non approuvée.");
    }
  }

  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description?.trim() ?? null;
  if (categoryId !== undefined) data.categoryId = categoryId ?? null;
  if (price !== undefined) data.price = parseInt(price);
  if (priceUsd !== undefined)
    data.priceUsd = priceUsd ? parseFloat(priceUsd) : null;
  if (stock !== undefined) data.stock = parseInt(stock);
  if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : [];
  if (status !== undefined) data.status = status;

  return prisma.product.update({
    where: { id: productId },
    data,
    include: { images: true, variants: true, category: true },
  });
};

// ─── Delete (archive) product ─────────────────────────────────────────────────

const archiveProduct = async ({ userId, shopId, productId }) => {
  const product = await getProductAndVerifyOwner(userId, shopId, productId);

  if (product.status === "ARCHIVED") {
    throw errors.badRequest("Ce produit est déjà archivé.");
  }

  return prisma.product.update({
    where: { id: productId },
    data: { status: "ARCHIVED", isFeatured: false },
  });
};

// ─── List all active products (global — for buyers) ───────────────────────────

const listAllProducts = async ({
  categoryId,
  shopId,
  search,
  isFeatured,
  page = 1,
  limit = 20,
}) => {
  const skip = (page - 1) * limit;
  const where = {
    status: "ACTIVE",
    shop: { status: "ACTIVE" }, // only from active shops
    ...(categoryId && { categoryId }),
    ...(shopId && { shopId }),
    ...(isFeatured !== undefined && {
      isFeatured: isFeatured === "true" || isFeatured === true,
    }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [
        { isFeatured: "desc" }, // featured first
        { createdAt: "desc" },
      ],
      skip,
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            commune: true,
            quartier: true,
          },
        },
        _count: { select: { variants: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const listProducts = async ({
  shopId,
  status,
  categoryId,
  page = 1,
  limit = 20,
}) => {
  const skip = (page - 1) * limit;
  const where = {
    shopId,
    ...(status && { status }),
    ...(categoryId && { categoryId }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 }, // primary image only for list
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { variants: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Get single product ───────────────────────────────────────────────────────

const getProduct = async ({ shopId, productId }) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { order: "asc" } },
      variants: true,
      category: true,
    },
  });

  if (!product || product.shopId !== shopId) {
    throw errors.notFound("Produit introuvable.");
  }

  return product;
};

// ─── Add images ───────────────────────────────────────────────────────────────

const addProductImages = async ({ userId, shopId, productId, imageUrls }) => {
  const product = await getProductAndVerifyOwner(userId, shopId, productId);

  // Check plan limit: maxImagesPerProduct
  const { limit, plan } = await checkLimit({
    userId,
    resource: "maxImagesPerProduct",
  });
  if (limit !== -1) {
    const currentCount = product.images.length;
    const newCount = currentCount + imageUrls.length;
    if (newCount > limit) {
      throw errors.badRequest(
        `Votre plan ${plan.name} permet ${limit} image(s) par produit. Ce produit en a déjà ${currentCount}.`,
      );
    }
  }

  // First image becomes primary if no images yet
  const hasPrimary = product.images.some((img) => img.isPrimary);
  const nextOrder = product.images.length;

  const data = imageUrls.map((url, i) => ({
    productId,
    url,
    isPrimary: !hasPrimary && i === 0,
    order: nextOrder + i,
  }));

  await prisma.productImage.createMany({ data });

  return prisma.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { order: "asc" } } },
  });
};

// ─── Delete image ─────────────────────────────────────────────────────────────

const deleteProductImage = async ({ userId, shopId, productId, imageId }) => {
  await getProductAndVerifyOwner(userId, shopId, productId);

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
  });
  if (!image || image.productId !== productId) {
    throw errors.notFound("Image introuvable.");
  }

  // Delete from Cloudinary
  const publicId = image.url.split("/").slice(-2).join("/").split(".")[0];
  cloudinary.uploader.destroy(publicId).catch(() => {});

  await prisma.productImage.delete({ where: { id: imageId } });

  // If deleted image was primary, promote next image
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { order: "asc" },
    });
    if (next) {
      await prisma.productImage.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  return true;
};

// ─── Set primary image ─────────────────────────────────────────────────────────

const setPrimaryImage = async ({ userId, shopId, productId, imageId }) => {
  await getProductAndVerifyOwner(userId, shopId, productId);

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
  });
  if (!image || image.productId !== productId) {
    throw errors.notFound("Image introuvable.");
  }

  // Unset all, then set the chosen one
  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    }),
  ]);

  return true;
};

// ─── Create variant ───────────────────────────────────────────────────────────

const createVariant = async ({
  userId,
  shopId,
  productId,
  name,
  options,
  price,
  priceUsd,
  stock,
  sku,
}) => {
  await getProductAndVerifyOwner(userId, shopId, productId);

  if (!name?.trim()) throw errors.badRequest("Le nom du variant est requis.");
  if (!options)
    throw errors.badRequest(
      "Les options du variant sont requises (couleur, taille, etc.).",
    );

  // Check plan limit: maxVariants
  const { limit, plan } = await checkLimit({ userId, resource: "maxVariants" });
  if (limit !== -1) {
    const count = await prisma.productVariant.count({ where: { productId } });
    if (count >= limit) {
      throw errors.badRequest(
        `Votre plan ${plan.name} permet ${limit} variant(s) par produit.`,
      );
    }
  }

  return prisma.productVariant.create({
    data: {
      productId,
      name: name.trim(),
      options,
      price: price ? parseInt(price) : null,
      priceUsd: priceUsd ? parseFloat(priceUsd) : null,
      stock: stock ? parseInt(stock) : 0,
      sku: sku?.trim() ?? null,
    },
  });
};

// ─── Update variant ───────────────────────────────────────────────────────────

const updateVariant = async ({
  userId,
  shopId,
  productId,
  variantId,
  name,
  options,
  price,
  priceUsd,
  stock,
  sku,
}) => {
  await getProductAndVerifyOwner(userId, shopId, productId);

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!variant || variant.productId !== productId) {
    throw errors.notFound("Variant introuvable.");
  }

  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (options !== undefined) data.options = options;
  if (price !== undefined) data.price = price ? parseInt(price) : null;
  if (priceUsd !== undefined)
    data.priceUsd = priceUsd ? parseFloat(priceUsd) : null;
  if (stock !== undefined) data.stock = parseInt(stock);
  if (sku !== undefined) data.sku = sku?.trim() ?? null;

  return prisma.productVariant.update({ where: { id: variantId }, data });
};

// ─── Delete variant ───────────────────────────────────────────────────────────

const deleteVariant = async ({ userId, shopId, productId, variantId }) => {
  await getProductAndVerifyOwner(userId, shopId, productId);

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!variant || variant.productId !== productId) {
    throw errors.notFound("Variant introuvable.");
  }

  await prisma.productVariant.delete({ where: { id: variantId } });
  return true;
};

// ─── Toggle featured ──────────────────────────────────────────────────────────

const toggleFeatured = async ({ userId, shopId, productId }) => {
  await getProductAndVerifyOwner(userId, shopId, productId);

  // Check plan: canFeatureProducts
  const { plan, subscription } = await checkLimit({
    userId,
    resource: "maxFeaturedProducts",
  });

  if (!plan.canFeatureProducts) {
    throw errors.badRequest(
      `Votre plan ${plan.name} ne permet pas de mettre des produits en vedette. Passez au plan Business ou supérieur.`,
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product.isFeatured) {
    // Check featured limit
    const { limit } = await checkLimit({
      userId,
      resource: "maxFeaturedProducts",
    });
    if (limit !== -1) {
      const featuredCount = await prisma.product.count({
        where: { shopId, isFeatured: true },
      });
      if (featuredCount >= limit) {
        throw errors.badRequest(
          `Votre plan ${plan.name} permet ${limit} produit(s) en vedette.`,
        );
      }
    }
  }

  return prisma.product.update({
    where: { id: productId },
    data: {
      isFeatured: !product.isFeatured,
      featuredAt: !product.isFeatured ? new Date() : null,
    },
  });
};

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
