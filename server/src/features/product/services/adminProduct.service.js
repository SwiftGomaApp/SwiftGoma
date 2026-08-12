const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError, BadRequestError } = require("../../../common/errors");
const {
  createNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");

const prisma = getPrismaClient();

const ADMIN_ALLOWED_STATUSES = ["DRAFT", "ARCHIVED"];

function serializeProduct(product) {
  const minPrice = product.variants?.length
    ? Math.min(...product.variants.map((v) => Number(v.price)))
    : null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    status: product.status,
    currency: product.currency,
    shop: product.shop,
    imageUrl: product.images?.[0]?.url ?? null,
    variantCount: product.variants?.length ?? 0,
    minPrice,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function listAdminProducts(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {};
  if (query.status) where.status = query.status;
  if (query.shopId) where.shopId = String(query.shopId);

  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { shop: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        shop: { select: { id: true, name: true, slug: true, status: true } },
        images: { orderBy: { position: "asc" }, take: 1 },
        variants: { select: { price: true } },
      },
    }),
  ]);

  return {
    items: products.map(serializeProduct),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function getAdminProductById(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      shop: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          sellerProfile: { select: { userId: true, businessName: true } },
        },
      },
      images: { orderBy: { position: "asc" } },
      variants: true,
      subcategory: { include: { category: true } },
    },
  });
  if (!product) throw new NotFoundError("Produit introuvable.");
  return serializeProduct(product);
}

async function adminUpdateProductStatus(productId, actor, { status, reason }) {
  if (!ADMIN_ALLOWED_STATUSES.includes(status)) {
    throw new BadRequestError(
      "Seuls les statuts DRAFT et ARCHIVED sont autorisés pour la modération admin.",
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      shop: { include: { sellerProfile: { include: { user: true } } } },
    },
  });
  if (!product) throw new NotFoundError("Produit introuvable.");

  if (product.status === status) {
    throw new BadRequestError(`Le produit est déjà en statut ${status}.`);
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { status },
    include: {
      shop: { select: { id: true, name: true, slug: true, status: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { select: { price: true } },
    },
  });

  try {
    const sellerUserId = product.shop.sellerProfile.userId;
    const actionLabel =
      status === "ARCHIVED" ? "retiré de la vente" : "repassé en brouillon";
    await createNotification({
      userId: sellerUserId,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: "Modération produit",
      body: `« ${product.name} » a été ${actionLabel} par l'équipe SwiftGoma.${
        reason?.trim() ? ` Motif : ${reason.trim()}` : ""
      }`,
      data: { productId, status, moderatedBy: actor.id },
    });
  } catch (err) {
    console.error("[admin-product] Notification failed:", err.message);
  }

  return serializeProduct(updated);
}

module.exports = {
  listAdminProducts,
  getAdminProductById,
  adminUpdateProductStatus,
};
