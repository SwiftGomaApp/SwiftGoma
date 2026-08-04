const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError } = require("../../../common/errors");

const prisma = getPrismaClient();

const PRODUCT_LIST_INCLUDE = {
  images: { orderBy: { position: "asc" }, take: 1 },
  variants: {
    select: { id: true, price: true, stock: true },
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
};

async function addFavorite(userId, productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) throw new NotFoundError("Produit introuvable.");

  return prisma.favorite.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
}

async function removeFavorite(userId, productId) {
  await prisma.favorite.deleteMany({ where: { userId, productId } });
  return { productId, removed: true };
}

async function listFavoriteIds(userId) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { productId: true },
  });
  return favorites.map((f) => f.productId);
}

async function listFavorites(userId, { page = 1, limit = 20 } = {}) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const where = {
    userId,
    product: {
      status: "PUBLISHED",
      shop: { status: "PUBLISHED", deletedAt: null },
    },
  };

  const [total, favorites] = await Promise.all([
    prisma.favorite.count({ where }),
    prisma.favorite.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
      include: { product: { include: PRODUCT_LIST_INCLUDE } },
    }),
  ]);

  return {
    products: favorites.map((f) => f.product),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

module.exports = { addFavorite, removeFavorite, listFavoriteIds, listFavorites };
