const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError, ConflictError } = require("../../../common/errors");
const {
  assertValidPlanInput,
  isValidBillingCycle,
  isValidCurrency,
  isValidPriceAmount,
} = require("../utils/plan.utils");
const cache = require("../../../common/services/cache");

const prisma = getPrismaClient();

async function invalidatePlanCaches({ id, slug } = {}) {
  await cache.bumpVersion("plans");
  if (id) await cache.del(`plans:id:${id}`);
  if (slug) await cache.del(`plans:slug:${slug}`);
}

async function createPlan({
  slug,
  name,
  maxProducts,
  maxPhotosPerProduct,
  maxShops = 1,
  prioritySupport = false,
  sortOrder = 0,
}) {
  const existing = await prisma.plan.findUnique({ where: { slug } });
  if (existing) {
    throw new ConflictError(`Un plan avec le slug "${slug}" existe déjà.`);
  }

  const input = { name, maxProducts, maxPhotosPerProduct, maxShops };
  assertValidPlanInput(input);

  const plan = await prisma.plan.create({
    data: {
      slug,
      name: name.trim(),
      maxProducts,
      maxPhotosPerProduct,
      maxShops,
      prioritySupport,
      sortOrder,
    },
    include: { prices: true },
  });

  await invalidatePlanCaches({});

  return plan;
}

async function listPlans({ includeInactive = false } = {}) {
  const version = await cache.getVersion("plans");
  const cacheKey = `plans:list:v${version}:${includeInactive}`;

  return cache.getOrSet(cacheKey, 900, async () => {
    return prisma.plan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { prices: true },
    });
  });
}

async function getPlanById(planId) {
  return cache.getOrSet(`plans:id:${planId}`, 900, async () => {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { prices: true },
    });

    if (!plan) throw new NotFoundError("Plan introuvable.");
    return plan;
  });
}

async function getPlanBySlug(slug) {
  return cache.getOrSet(`plans:slug:${slug}`, 900, async () => {
    const plan = await prisma.plan.findUnique({
      where: { slug },
      include: { prices: true },
    });

    if (!plan) throw new NotFoundError("Plan introuvable.");
    return plan;
  });
}

async function updatePlan(planId, data) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError("Plan introuvable.");

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.maxProducts !== undefined) updateData.maxProducts = data.maxProducts;
  if (data.maxPhotosPerProduct !== undefined) {
    updateData.maxPhotosPerProduct = data.maxPhotosPerProduct;
  }
  if (data.maxShops !== undefined) updateData.maxShops = data.maxShops;
  if (data.prioritySupport !== undefined) {
    updateData.prioritySupport = data.prioritySupport;
  }
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  assertValidPlanInput({ ...plan, ...updateData });

  const updated = await prisma.plan.update({
    where: { id: planId },
    data: updateData,
    include: { prices: true },
  });

  await invalidatePlanCaches({ id: plan.id, slug: plan.slug });

  return updated;
}

async function updatePlanPrice(planId, { billingCycle, currency, amount }) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError("Plan introuvable.");

  if (!isValidBillingCycle(billingCycle)) {
    throw new ConflictError("Cycle de facturation invalide.");
  }
  if (!isValidCurrency(currency)) {
    throw new ConflictError("Devise non prise en charge.");
  }
  if (!isValidPriceAmount(amount)) {
    throw new ConflictError("Montant invalide.");
  }

  const price = await prisma.planPrice.upsert({
    where: {
      planId_billingCycle_currency: { planId, billingCycle, currency },
    },
    update: { amount },
    create: { planId, billingCycle, currency, amount },
  });

  await invalidatePlanCaches({ id: plan.id, slug: plan.slug });

  return price;
}

async function setPlanActive(planId, isActive) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError("Plan introuvable.");

  const updated = await prisma.plan.update({
    where: { id: planId },
    data: { isActive },
    include: { prices: true },
  });

  await invalidatePlanCaches({ id: plan.id, slug: plan.slug });

  return updated;
}

module.exports = {
  listPlans,
  getPlanById,
  getPlanBySlug,
  createPlan,
  updatePlan,
  updatePlanPrice,
  setPlanActive,
};
