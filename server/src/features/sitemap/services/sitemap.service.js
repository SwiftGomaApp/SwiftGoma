const { getPrismaClient } = require("../../../config/prisma");

const MAX_SITEMAP_ENTRIES = 5000;

async function listProductsForSitemap() {
  const prisma = getPrismaClient();
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: MAX_SITEMAP_ENTRIES,
  });

  return products.map((product) => ({
    slug: product.slug,
    updatedAt: product.updatedAt,
  }));
}

async function listShopsForSitemap() {
  const prisma = getPrismaClient();
  const shops = await prisma.shop.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: MAX_SITEMAP_ENTRIES,
  });

  return shops.map((shop) => ({
    slug: shop.slug,
    updatedAt: shop.updatedAt,
  }));
}

module.exports = { listProductsForSitemap, listShopsForSitemap };
