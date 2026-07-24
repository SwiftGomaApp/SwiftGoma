const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError, ConflictError } = require("../../../common/errors");
const {
  uploadImage,
  deleteAsset,
} = require("../../../common/services/cloudinaryUpload");
const {
  CLOUDINARY_FOLDERS,
} = require("../../../common/constants/cloudinaryFolders");
const {
  generateSlug,
  assertValidProductInput,
  assertValidVariantInput,
  assertValidStatusTransition,
  assertCanCreateProduct,
  assertPhotoLimitNotExceeded,
  assertExpiryRequiredIfFood,
} = require("../utils/product.utils");
const { Prisma } = require("../../../../generated/prisma");

const prisma = getPrismaClient();

async function getProductIdsSortedByPrice({ where, direction, skip, take }) {
  const conditions = [
    Prisma.sql`p.status = 'PUBLISHED'`,
    Prisma.sql`s.status = 'PUBLISHED'`,
    Prisma.sql`s."deletedAt" IS NULL`,
  ];

  if (where.subcategoryId)
    conditions.push(Prisma.sql`p."subcategoryId" = ${where.subcategoryId}`);
  if (where.categoryId)
    conditions.push(Prisma.sql`sc."categoryId" = ${where.categoryId}`);
  if (where.shopId) conditions.push(Prisma.sql`p."shopId" = ${where.shopId}`);
  if (where.currency)
    conditions.push(Prisma.sql`p.currency = ${where.currency}`);
  if (where.city) conditions.push(Prisma.sql`sp.city = ${where.city}`);
  if (where.search) {
    const term = `%${where.search}%`;
    conditions.push(
      Prisma.sql`(p.name ILIKE ${term} OR p.description ILIKE ${term} OR p.brand ILIKE ${term})`,
    );
  }
  if (where.minPrice !== undefined)
    conditions.push(Prisma.sql`v.price >= ${where.minPrice}`);
  if (where.maxPrice !== undefined)
    conditions.push(Prisma.sql`v.price <= ${where.maxPrice}`);
  if (where.inStockOnly === "true" || where.inStockOnly === true) {
    conditions.push(Prisma.sql`v.stock > 0`);
  }

  const whereClause = Prisma.join(conditions, " AND ");
  const orderDirection =
    direction === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;

  const rows = await prisma.$queryRaw`
    SELECT p.id, MIN(v.price) as "minPrice"
FROM products p
JOIN shops s ON s.id = p."shopId"
JOIN seller_profiles sp ON sp.id = s."sellerProfileId"
JOIN subcategories sc ON sc.id = p."subcategoryId"
JOIN product_variants v ON v."productId" = p.id
WHERE ${whereClause}
GROUP BY p.id
ORDER BY "minPrice" ${orderDirection}
LIMIT ${take}
OFFSET ${skip};
  `;

  return rows.map((r) => r.id);
}

async function assertShopOwnedBySeller(shopId, sellerProfileId) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop || shop.sellerProfileId !== sellerProfileId || shop.deletedAt) {
    throw new NotFoundError("Boutique introuvable.");
  }
  return shop;
}

async function getSubcategoryWithCategory(subcategoryId) {
  const subcategory = await prisma.subcategory.findUnique({
    where: { id: subcategoryId },
    include: { category: true },
  });
  if (!subcategory) throw new NotFoundError("Sous-catégorie introuvable.");
  return subcategory;
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

  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

async function createProduct({
  shopId,
  sellerProfileId,
  subcategoryId,
  name,
  description,
  brand,
  unit,
  weightGrams,
  expiresAt,
  currency,
  variants,
  imageBuffers,
}) {
  await assertShopOwnedBySeller(shopId, sellerProfileId);
  const subcategory = await getSubcategoryWithCategory(subcategoryId);

  const subscription = await getActiveSubscriptionWithPlan(sellerProfileId);
  if (!subscription || subscription.status !== "ACTIVE") {
    throw new ConflictError(
      "Un abonnement actif est requis pour créer un produit.",
    );
  }

  const currentProductCount = await prisma.product.count({
    where: { shopId },
  });
  assertCanCreateProduct(
    currentProductCount,
    subscription.plan.maxProducts,
    subscription.plan.name,
  );

  assertValidProductInput({ name, description, currency, unit, weightGrams });
  assertExpiryRequiredIfFood(subcategory.category.slug, expiresAt);

  if (!variants || variants.length === 0) {
    throw new ConflictError("Au moins une variante est requise.");
  }
  const hasVariants = variants.length > 1;
  variants.forEach((v) => assertValidVariantInput(v, currency));

  const photoCount = imageBuffers?.length || 0;
  assertPhotoLimitNotExceeded(
    0,
    photoCount,
    subscription.plan.maxPhotosPerProduct,
    subscription.plan.name,
  );

  const slug = await generateUniqueSlug(name);

  const uploadedImages = imageBuffers?.length
    ? await Promise.all(
        imageBuffers.map((img, i) =>
          uploadImage(img.buffer, CLOUDINARY_FOLDERS.PRODUCT_IMAGES).then(
            (res) => ({
              url: res.url,
              publicId: res.publicId,
              position: i,
            }),
          ),
        ),
      )
    : [];

  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          shopId,
          subcategoryId,
          name: name.trim(),
          slug,
          description,
          brand: brand || null,
          unit: unit || "piece",
          weightGrams: weightGrams || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          currency,
          status: "DRAFT",
          hasVariants,
        },
      });

      for (const img of uploadedImages) {
        await tx.productImage.create({
          data: { productId: product.id, ...img },
        });
      }

      for (const v of variants) {
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            name: v.name || null,
            attributes: v.attributes || undefined,
            sku: v.sku || null,
            price: v.price,
            stock: v.stock,
            isDefault: !hasVariants,
          },
        });

        if (v.stock > 0) {
          await tx.stockMovement.create({
            data: {
              variantId: variant.id,
              type: "RESTOCK",
              amount: v.stock,
              reason: "Stock initial à la création du produit",
              stockBefore: 0,
              stockAfter: v.stock,
            },
          });
        }
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: { images: true, variants: true },
      });
    });
  } catch (err) {
    await Promise.all(
      uploadedImages.map((img) => deleteAsset(img.publicId, "image")),
    );
    throw err;
  }
}

async function getProductById(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: true,
      subcategory: { include: { category: true } },
      shop: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!product) throw new NotFoundError("Produit introuvable.");
  return product;
}

async function getProductBySlug(slug) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: true,
      subcategory: { include: { category: true } },
      shop: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  });

  if (
    !product ||
    product.status !== "PUBLISHED" ||
    product.shop.status !== "PUBLISHED" ||
    product.shop.deletedAt
  ) {
    throw new NotFoundError("Produit introuvable.");
  }

  return product;
}

async function listProductsForShop(
  shopId,
  { page = 1, limit = 20, status } = {},
) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const where = { shopId, ...(status ? { status } : {}) };

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: true,
      },
    }),
  ]);

  return {
    products,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

async function updateProduct(productId, sellerProfileId, data) {
  const product = await getProductById(productId);
  await assertShopOwnedBySeller(product.shopId, sellerProfileId);

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.brand !== undefined) updateData.brand = data.brand;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.weightGrams !== undefined) updateData.weightGrams = data.weightGrams;
  if (data.expiresAt !== undefined) {
    updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  }

  assertValidProductInput({
    name: updateData.name ?? product.name,
    description: updateData.description ?? product.description,
    currency: product.currency,
    unit: updateData.unit ?? product.unit,
    weightGrams: updateData.weightGrams ?? product.weightGrams,
  });

  return prisma.product.update({
    where: { id: productId },
    data: updateData,
    include: { images: true, variants: true },
  });
}

async function setProductStatus(productId, sellerProfileId, nextStatus) {
  const product = await getProductById(productId);
  await assertShopOwnedBySeller(product.shopId, sellerProfileId);

  assertValidStatusTransition(product.status, nextStatus);

  return prisma.product.update({
    where: { id: productId },
    data: { status: nextStatus },
  });
}

async function adjustStock(
  variantId,
  sellerProfileId,
  { type, amount, reason },
) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant) throw new NotFoundError("Variante introuvable.");

  await assertShopOwnedBySeller(variant.product.shopId, sellerProfileId);

  const stockBefore = variant.stock;
  const stockAfter = stockBefore + amount;
  if (stockAfter < 0) {
    throw new ConflictError("Le stock ne peut pas être négatif.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: stockAfter },
    });

    await tx.stockMovement.create({
      data: {
        variantId,
        type,
        amount,
        reason: reason || null,
        stockBefore,
        stockAfter,
      },
    });

    return updated;
  });
}

async function getStockHistory(
  variantId,
  sellerProfileId,
  { page = 1, limit = 20 } = {},
) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant) throw new NotFoundError("Variante introuvable.");

  await assertShopOwnedBySeller(variant.product.shopId, sellerProfileId);

  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const [total, movements] = await prisma.$transaction([
    prisma.stockMovement.count({ where: { variantId } }),
    prisma.stockMovement.findMany({
      where: { variantId },
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    movements,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

async function listAllProducts({
  page = 1,
  limit = 20,
  categoryId,
  subcategoryId,
  shopId,
  minPrice,
  maxPrice,
  currency,
  search,
  inStockOnly,
  city,
  sortBy = "recent",
} = {}) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const baseWhere = {
    status: "PUBLISHED",
    shop: {
      status: "PUBLISHED",
      deletedAt: null,
      ...(city ? { sellerProfile: { city } } : {}),
    },
    ...(shopId ? { shopId } : {}),
    ...(subcategoryId ? { subcategoryId } : {}),
    ...(categoryId ? { subcategory: { categoryId } } : {}),
    ...(currency ? { currency } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(inStockOnly === "true" || inStockOnly === true
      ? { variants: { some: { stock: { gt: 0 } } } }
      : {}),
  };

  if (sortBy === "priceAsc" || sortBy === "priceDesc") {
    const direction = sortBy === "priceAsc" ? "asc" : "desc";
    const orderedIds = await getProductIdsSortedByPrice({
      where: {
        categoryId,
        subcategoryId,
        shopId,
        minPrice,
        maxPrice,
        currency,
        search,
        city,
        inStockOnly,
      },
      direction,
      skip,
      take: safeLimit,
    });

    const products = await prisma.product.findMany({
      where: { id: { in: orderedIds } },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: {
          select: { price: true, stock: true },
          take: 1,
          orderBy: { price: "asc" },
        },
        subcategory: { include: { category: true } },
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            sellerProfile: { select: { city: true } },
          },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const orderedProducts = orderedIds
      .map((id) => productMap.get(id))
      .filter(Boolean);

    const total = await prisma.product.count({ where: baseWhere });

    return {
      products: orderedProducts,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where: baseWhere }),
    prisma.product.findMany({
      where: baseWhere,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: {
          select: { price: true, stock: true },
          take: 1,
          orderBy: { price: "asc" },
        },
        subcategory: { include: { category: true } },
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            sellerProfile: { select: { city: true } },
          },
        },
      },
    }),
  ]);

  return {
    products,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

module.exports = {
  createProduct,
  getProductById,
  getProductBySlug,
  listProductsForShop,
  listAllProducts,
  updateProduct,
  setProductStatus,
  adjustStock,
  getStockHistory,
};
