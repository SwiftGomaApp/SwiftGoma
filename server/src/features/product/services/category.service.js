const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError, ConflictError } = require("../../../common/errors");
const {
  generateSlug,
  assertValidCategoryInput,
  assertValidSubcategoryInput,
} = require("../utils/category.utils");
const { CATEGORY_CONFIG } = require("../config/category.config");

const prisma = getPrismaClient();

async function generateUniqueSlug(name, model) {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (await model.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

async function createCategory({ name, sortOrder = 0 }) {
  assertValidCategoryInput({ name });

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) {
    throw new ConflictError(`La catégorie "${name}" existe déjà.`);
  }

  const slug = await generateUniqueSlug(name, prisma.category);

  return prisma.category.create({
    data: { name: name.trim(), slug, sortOrder },
  });
}

async function listCategories({ includeInactive = false } = {}) {
  return prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      subcategories: {
        where: includeInactive ? {} : { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

async function getCategoryById(categoryId) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { subcategories: { orderBy: { sortOrder: "asc" } } },
  });
  if (!category) throw new NotFoundError("Catégorie introuvable.");
  return category;
}

async function updateCategory(categoryId, data) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) throw new NotFoundError("Catégorie introuvable.");

  const updateData = {};
  if (data.name !== undefined) {
    assertValidCategoryInput({ name: data.name });
    updateData.name = data.name.trim();
  }
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.category.update({
    where: { id: categoryId },
    data: updateData,
  });
}

async function createSubcategory({ categoryId, name, sortOrder = 0 }) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) throw new NotFoundError("Catégorie parente introuvable.");

  assertValidSubcategoryInput({ categoryId, name });

  const existing = await prisma.subcategory.findFirst({
    where: { categoryId, name },
  });
  if (existing) {
    throw new ConflictError(
      `La sous-catégorie "${name}" existe déjà dans "${category.name}".`,
    );
  }

  const slug = await generateUniqueSlug(name, prisma.subcategory);

  return prisma.subcategory.create({
    data: { categoryId, name: name.trim(), slug, sortOrder },
  });
}

async function updateSubcategory(subcategoryId, data) {
  const subcategory = await prisma.subcategory.findUnique({
    where: { id: subcategoryId },
  });
  if (!subcategory) throw new NotFoundError("Sous-catégorie introuvable.");

  const updateData = {};
  if (data.name !== undefined) {
    assertValidSubcategoryInput({
      categoryId: subcategory.categoryId,
      name: data.name,
    });
    updateData.name = data.name.trim();
  }
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.subcategory.update({
    where: { id: subcategoryId },
    data: updateData,
  });
}

async function seedDefaultCategories() {
  const results = [];

  for (const catDef of CATEGORY_CONFIG.DEFAULT_CATEGORIES) {
    let category = await prisma.category.findUnique({
      where: { name: catDef.name },
    });

    if (!category) {
      const slug = await generateUniqueSlug(catDef.name, prisma.category);
      category = await prisma.category.create({
        data: { name: catDef.name, slug },
      });
    }

    for (let i = 0; i < catDef.subcategories.length; i++) {
      const subName = catDef.subcategories[i];
      const existing = await prisma.subcategory.findFirst({
        where: { categoryId: category.id, name: subName },
      });
      if (!existing) {
        const subSlug = await generateUniqueSlug(subName, prisma.subcategory);
        await prisma.subcategory.create({
          data: {
            categoryId: category.id,
            name: subName,
            slug: subSlug,
            sortOrder: i,
          },
        });
      }
    }

    results.push(category.name);
  }

  return results;
}

module.exports = {
  createCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  createSubcategory,
  updateSubcategory,
  seedDefaultCategories,
};
