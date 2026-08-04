const { getPrismaClient } = require("../../../config/prisma");
const { ValidationError, ForbiddenError, NotFoundError } = require("../../../common/errors");
const { invalidateProductCaches } = require("./product.service");
const { invalidateShopCache } = require("../../seller/services/shop.service");

const prisma = getPrismaClient();

const QUALIFYING_ORDER_STATUSES = ["DELIVERED", "COMPLETED"];

async function assertPurchased(userId, productId) {
  const item = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { buyerId: userId, status: { in: QUALIFYING_ORDER_STATUSES } },
    },
  });
  if (!item) {
    throw new ForbiddenError(
      "Vous devez avoir reçu ce produit pour laisser un avis.",
    );
  }
}

async function submitReview({ userId, productId, rating, comment }) {
  const ratingInt = Number(rating);
  if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 5) {
    throw new ValidationError("La note doit être un nombre entier entre 1 et 5.");
  }
  if (!comment || typeof comment !== "string" || !comment.trim()) {
    throw new ValidationError("Veuillez rédiger un commentaire.");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, shop: { select: { slug: true } } },
  });
  if (!product) throw new NotFoundError("Produit introuvable.");

  await assertPurchased(userId, productId);

  const review = await prisma.productReview.upsert({
    where: { productId_userId: { productId, userId } },
    update: { rating: ratingInt, comment: comment.trim() },
    create: { productId, userId, rating: ratingInt, comment: comment.trim() },
  });

  await Promise.all([
    invalidateProductCaches(product.slug),
    invalidateShopCache(product.shop.slug),
  ]);

  return review;
}

async function getProductRatingSummary(productId) {
  const result = await prisma.productReview.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  });
  return { average: result._avg.rating ?? 0, count: result._count };
}

async function listProductReviews(productId, limit = 20) {
  const reviews = await prisma.productReview.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });

  return reviews.map((r) => ({
    id: r.id,
    authorName: r.user.name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  }));
}

async function getPurchaseCount(productId) {
  const items = await prisma.orderItem.findMany({
    where: {
      productId,
      order: { status: { in: QUALIFYING_ORDER_STATUSES } },
    },
    select: { order: { select: { buyerId: true } } },
  });
  const buyerIds = new Set(items.map((i) => i.order.buyerId));
  return buyerIds.size;
}

async function getShopRatingSummary(shopId) {
  const result = await prisma.productReview.aggregate({
    where: { product: { shopId } },
    _avg: { rating: true },
    _count: true,
  });
  return { average: result._avg.rating ?? 0, count: result._count };
}

module.exports = {
  submitReview,
  getProductRatingSummary,
  listProductReviews,
  getPurchaseCount,
  getShopRatingSummary,
};
