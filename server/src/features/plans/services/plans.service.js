const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError, ConflictError } = require("../../../common/errors");
const {
  assertValidPlanInput,
  isValidBillingCycle,
  isValidCurrency,
  isValidPriceAmount,
} = require("../utils/plan.utils");

const prisma = getPrismaClient();

async function createPlan({
  slug,
  name,
  maxProducts,
  maxPhotosPerProduct,
  prioritySupport = false,
  sortOrder = 0,
}) {
  const existing = await prisma.plan.findUnique({ where: { slug } });
  if (existing) {
    throw new ConflictError(`Un plan avec le slug "${slug}" existe déjà.`);
  }

  const input = { name, maxProducts, maxPhotosPerProduct };
  assertValidPlanInput(input);

  return prisma.plan.create({
    data: {
      slug,
      name: name.trim(),
      maxProducts,
      maxPhotosPerProduct,
      prioritySupport,
      sortOrder,
    },
    include: { prices: true },
  });
}

async function listPlans({ includeInactive = false } = {}) {
  const plans = await prisma.plan.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { prices: true },
  });

  return plans;
}

async function getPlanById(planId) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { prices: true },
  });

  if (!plan) throw new NotFoundError("Plan introuvable.");
  return plan;
}

async function getPlanBySlug(slug) {
  const plan = await prisma.plan.findUnique({
    where: { slug },
    include: { prices: true },
  });

  if (!plan) throw new NotFoundError("Plan introuvable.");
  return plan;
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
  if (data.prioritySupport !== undefined) {
    updateData.prioritySupport = data.prioritySupport;
  }
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  assertValidPlanInput({ ...plan, ...updateData });

  return prisma.plan.update({
    where: { id: planId },
    data: updateData,
    include: { prices: true },
  });
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

  return prisma.planPrice.upsert({
    where: {
      planId_billingCycle_currency: { planId, billingCycle, currency },
    },
    update: { amount },
    create: { planId, billingCycle, currency, amount },
  });
}

async function setPlanActive(planId, isActive) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError("Plan introuvable.");

  return prisma.plan.update({
    where: { id: planId },
    data: { isActive },
    include: { prices: true },
  });
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
