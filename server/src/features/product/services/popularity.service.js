const { getPrismaClient } = require("../../../config/prisma");
const { getRedisClient } = require("../../../config/redis");

const prisma = getPrismaClient();

const POPULARITY_WINDOW_DAYS = 30;

const WEIGHTS = {
  sales: 5,
  favorites: 3,
  views: 1,
  reviews: 0.5,
};

async function getViewCounts(productIds) {
  const redis = getRedisClient();
  if (!redis || productIds.length === 0) {
    return new Map(productIds.map((id) => [id, 0]));
  }

  const keys = productIds.map((id) => `product:views:${id}`);

  const pipeline = redis.pipeline();
  keys.forEach((key) => pipeline.getdel(key));
  const results = await pipeline.exec();

  const counts = new Map(
    productIds.map((id, i) => [id, Number(results[i]?.[1]) || 0]),
  );

  return counts;
}

async function recalculateProductPopularity() {
  const since = new Date();
  since.setDate(since.getDate() - POPULARITY_WINDOW_DAYS);

  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true },
  });

  if (products.length === 0) return 0;

  const productIds = products.map((p) => p.id);

  const [salesRows, favoritesRows, reviewsRows, viewsMap] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds }, createdAt: { gte: since } },
      _sum: { quantity: true },
    }),
    prisma.favorite.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds }, createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.productReview.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds }, createdAt: { gte: since } },
      _count: { _all: true },
      _avg: { rating: true },
    }),
    getViewCounts(productIds),
  ]);

  const salesMap = new Map(
    salesRows.map((r) => [r.productId, r._sum.quantity || 0]),
  );
  const favoritesMap = new Map(
    favoritesRows.map((r) => [r.productId, r._count._all]),
  );
  const reviewsMap = new Map(
    reviewsRows.map((r) => [
      r.productId,
      { count: r._count._all, avg: r._avg.rating || 0 },
    ]),
  );

  const updates = productIds.map((id) => {
    const sales = salesMap.get(id) || 0;
    const favorites = favoritesMap.get(id) || 0;
    const views = viewsMap.get(id) || 0;
    const reviews = reviewsMap.get(id) || { count: 0, avg: 0 };

    const score =
      sales * WEIGHTS.sales +
      favorites * WEIGHTS.favorites +
      views * WEIGHTS.views +
      reviews.avg * reviews.count * WEIGHTS.reviews;

    return { id, score };
  });

  const results = await Promise.allSettled(
    updates.map((u) => {
      const views = viewsMap.get(u.id) || 0;
      return prisma.product.update({
        where: { id: u.id },
        data: {
          popularityScore: u.score,
          viewsCount: { increment: views },
        },
      });
    }),
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error(
      `[product] ${failed.length} mise(s) à jour de popularité échouée(s):`,
      failed[0].reason?.message,
    );
  }

  return results.length - failed.length;
}

module.exports = { recalculateProductPopularity };
