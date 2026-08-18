const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError } = require("../../../common/errors");
const {
  uploadImage,
  deleteAsset,
} = require("../../../common/services/cloudinaryUpload");
const {
  CLOUDINARY_FOLDERS,
} = require("../../../common/constants/cloudinaryFolders");
const {
  assertValidHeroSlideInput,
  assertRoleNotAlreadyUsed,
  assertProductEligibleForHero,
  formatHeroSlideForClient,
} = require("../utils/heroslides.utils");
const cache = require("../../../common/services/cache");

const prisma = getPrismaClient();

const PRODUCT_INCLUDE = {
  images: { orderBy: { position: "asc" }, take: 1 },
  variants: true,
  shop: { select: { status: true, deletedAt: true } },
};

async function invalidateHeroSlideCaches() {
  await cache.bumpVersion("heroSlides");
}

async function createHeroSlide({
  role,
  title,
  description,
  searchPlaceholder,
  productId,
  sortOrder = 0,
  imageBuffer,
}) {
  assertValidHeroSlideInput({ role, title, description, searchPlaceholder });

  const existingForRole = await prisma.heroSlide.findUnique({
    where: { role },
  });

  assertRoleNotAlreadyUsed(existingForRole, role);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: PRODUCT_INCLUDE,
  });

  assertProductEligibleForHero(product);

  if (!imageBuffer) {
    throw new NotFoundError("Une image est requise pour le slide hero.");
  }

  const uploaded = await uploadImage(
    imageBuffer,
    CLOUDINARY_FOLDERS.HERO_SLIDES,
  );

  try {
    const slide = await prisma.heroSlide.create({
      data: {
        role,
        title: title.trim(),
        description: description.trim(),
        searchPlaceholder: searchPlaceholder.trim(),
        imageUrl: uploaded.url,
        imagePublicId: uploaded.publicId,
        productId,
        sortOrder,
      },
      include: { product: { include: PRODUCT_INCLUDE } },
    });

    await invalidateHeroSlideCaches();

    return slide;
  } catch (err) {
    await deleteAsset(uploaded.publicId, "image");
    throw err;
  }
}

async function updateHeroSlide(heroSlideId, data) {
  const existing = await prisma.heroSlide.findUnique({
    where: { id: heroSlideId },
  });
  if (!existing) throw new NotFoundError("Slide hero introuvable.");

  const {
    role,
    title,
    description,
    searchPlaceholder,
    productId,
    sortOrder,
    isActive,
    imageBuffer,
  } = data;

  if (
    role !== undefined ||
    title !== undefined ||
    description !== undefined ||
    searchPlaceholder !== undefined
  ) {
    assertValidHeroSlideInput({
      role: role ?? existing.role,
      title: title ?? existing.title,
      description: description ?? existing.description,
      searchPlaceholder: searchPlaceholder ?? existing.searchPlaceholder,
    });
  }

  if (role !== undefined && role !== existing.role) {
    const conflicting = await prisma.heroSlide.findUnique({ where: { role } });
    assertRoleNotAlreadyUsed(conflicting, role);
  }

  if (productId !== undefined && productId !== existing.productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: PRODUCT_INCLUDE,
    });
    assertProductEligibleForHero(product);
  }

  let uploaded = null;
  if (imageBuffer) {
    uploaded = await uploadImage(imageBuffer, CLOUDINARY_FOLDERS.HERO_SLIDES);
  }

  try {
    const updated = await prisma.heroSlide.update({
      where: { id: heroSlideId },
      data: {
        ...(role !== undefined && { role }),
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(searchPlaceholder !== undefined && {
          searchPlaceholder: searchPlaceholder.trim(),
        }),
        ...(productId !== undefined && { productId }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(uploaded && {
          imageUrl: uploaded.url,
          imagePublicId: uploaded.publicId,
        }),
      },
      include: { product: { include: PRODUCT_INCLUDE } },
    });

    if (uploaded) {
      await deleteAsset(existing.imagePublicId, "image");
    }

    await invalidateHeroSlideCaches();

    return updated;
  } catch (err) {
    if (uploaded) {
      await deleteAsset(uploaded.publicId, "image");
    }
    throw err;
  }
}

async function deleteHeroSlide(heroSlideId) {
  const existing = await prisma.heroSlide.findUnique({
    where: { id: heroSlideId },
  });
  if (!existing) throw new NotFoundError("Slide hero introuvable");

  await prisma.heroSlide.delete({ where: { id: heroSlideId } });
  await deleteAsset(existing.imagePublicId, "image");
  await invalidateHeroSlideCaches();

  return { id: heroSlideId, deleted: true };
}

async function listHeroSlidesAdmin() {
  return prisma.heroSlide.findMany({
    orderBy: { sortOrder: "asc" },
    include: { product: { include: PRODUCT_INCLUDE } },
  });
}

async function getActiveHeroSlides() {
  const version = await cache.getVersion("heroSlides");
  const cacheKey = `heroSlides:active:v${version}`;

  return cache.getOrSet(cacheKey, 300, async () => {
    const slides = await prisma.heroSlide.findMany({
      where: {
        isActive: true,
        product: {
          status: "PUBLISHED",
          shop: { status: "PUBLISHED", deletedAt: null },
        },
      },
      orderBy: { sortOrder: "asc" },
      include: { product: { include: PRODUCT_INCLUDE } },
    });

    return slides.map(formatHeroSlideForClient);
  });
}

module.exports = {
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  listHeroSlidesAdmin,
  getActiveHeroSlides,
};
