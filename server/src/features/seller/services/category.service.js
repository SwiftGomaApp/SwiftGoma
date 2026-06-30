const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");

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

  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix++;
  }

  return slug;
};

const listCategories = async ({ parentId = null } = {}) => {
  return prisma.category.findMany({
    where: {
      status: "APPROVED",
      parentId: parentId ?? null,
    },
    include: {
      children: {
        where: { status: "APPROVED" },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
};

const getCategoryBySlug = async (slug) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: { where: { status: "APPROVED" }, orderBy: { name: "asc" } },
      parent: true,
    },
  });

  if (!category || category.status !== "APPROVED") {
    throw errors.notFound("Categories introuvable.");
  }

  return category;
};

const suggestCategory = async ({ userId, name, description, parentId }) => {
  if (!name?.trim())
    throw errors.badRequest("Le nom de la catégorie est requis.");

  const existing = await prisma.category.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" } },
  });

  if (existing) {
    if (existing.status === "APPROVED") {
      throw errors.badRequest("Cette catégorie existe déjà.");
    }
    if (existing.status === "PENDING") {
      throw errors.badRequest(
        "Cette catégorie est déjà en attente de validation.",
      );
    }
  }

  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
    });
    if (!parent || parent.status !== "APPROVED") {
      throw errors.badRequest("Catégorie parente introuvable.");
    }
  }

  const slug = await generateSlug(name.trim());

  return prisma.category.create({
    data: {
      name: name.trim(),
      slug,
      description: description?.trim() ?? null,
      parentId: parentId ?? null,
      status: "PENDING",
      suggestedBy: userId,
    },
  });
};

const supportListCategories = async ({ status, page = 1, limit = 50 }) => {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        parent: { select: { id: true, name: true } },
        suggester: { select: { id: true, name: true, email: true } },
        _count: { select: { products: true } },
      },
    }),
    prisma.category.count({ where }),
  ]);

  return {
    categories,
    pagination: { page, limit, total, totalPage: Math.ceil(total / limit) },
  };
};

const supportCreateCategory = async ({
  name,
  description,
  parentId,
  image,
}) => {
  if (!name?.trim()) throw errors.badRequest("Le nom est requis.");

  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
    });
    if (!parent) throw errors.badRequest("Catégorie parente introuvable.");
  }

  const slug = await generateSlug(name.trim());

  return prisma.category.create({
    data: {
      name: name.trim(),
      slug,
      description: description?.trim() ?? null,
      parentId: parentId ?? null,
      image: image ?? null,
      status: "APPROVED",
    },
  });
};

const approveCategory = async ({ categoryId }) => {
  const cat = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!cat) throw errors.notFound("Catégorie introuvable.");
  if (cat.status === "APPROVED")
    throw errors.badRequest("Catégorie déjà approuvée.");

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      status: "APPROVED",
      rejectedNote: null,
    },
  });
};

const rejectCategory = async ({ categoryId, reason }) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) throw errors.notFound("Catégorie introuvable.");

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      status: "REJECTED",
      rejectedNote: reason?.trim() ?? null,
    },
  });
};

const supportUpdateCategory = async ({
  categoryId,
  name,
  description,
  parentId,
  image,
}) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) throw errors.notFound("Catégorie introuvable.");

  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description?.trim() ?? null;
  if (parentId !== undefined) data.parentId = parentId ?? null;
  if (image !== undefined) data.image = image ?? null;

  return prisma.category.update({ where: { id: categoryId }, data });
};

const supportDeleteCategory = async ({ categoryId }) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { products: true, children: true } } },
  });

  if (!category) throw errors.notFound("Catégorie introuvable.");

  if (category._count.products > 0) {
    throw errors.badRequest(
      `Impossible de supprimer : ${category._count.products} produit(s) utilisent cette catégorie.`,
    );
  }

  if (category._count.children > 0) {
    throw errors.badRequest(
      `Impossible de supprimer : cette catégorie a ${category._count.children} sous-catégorie(s).`,
    );
  }

  await prisma.category.delete({ where: { id: categoryId } });
  return true;
};

module.exports = {
  listCategories,
  getCategoryBySlug,
  suggestCategory,
  supportListCategories,
  supportCreateCategory,
  approveCategory,
  rejectCategory,
  supportUpdateCategory,
  supportDeleteCategory,
};
