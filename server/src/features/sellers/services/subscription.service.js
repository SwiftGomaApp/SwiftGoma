const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { YEARLY_BILLED_MONTHS } = require("../constants/billing.constant");

const computeYearlyPrice = (priceMonthly) =>
  priceMonthly.mul(YEARLY_BILLED_MONTHS).toFixed(2);

const withYearlyPrice = (price) =>
  price && {
    ...price,
    priceYearly: computeYearlyPrice(price.priceMonthly),
  };

const pickPrice = (prices, currency) => {
  if (!prices.length) return null;
  if (currency) return prices.find((p) => p.currency === currency) ?? null;
  return prices.find((p) => p.isDefault) ?? prices[0];
};

/* ── Public ───────────────────────────────────────────────────────────── */

const listPlans = async ({ country, currency } = {}) => {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      prices: country ? { where: { country } } : true,
    },
  });

  return plans.map(({ prices, ...plan }) => {
    const withYearly = prices.map(withYearlyPrice);

    if (country && currency) {
      return {
        ...plan,
        price: withYearly.find((p) => p.currency === currency) ?? null,
      };
    }

    return { ...plan, prices: withYearly };
  });
};

const getPlanBySlug = async ({ slug, country, currency }) => {
  const plan = await prisma.plan.findUnique({
    where: { slug },
    include: { prices: country ? { where: { country } } : true },
  });

  if (!plan || !plan.isActive) throw errors.notFound("Plan introuvable.");

  if (country) {
    const price = pickPrice(plan.prices, currency);
    if (!price) {
      throw errors.notFound(
        "Ce plan n'est pas encore disponible dans votre pays.",
      );
    }
    const { prices, ...rest } = plan;
    return { ...rest, price: withYearlyPrice(price) };
  }

  return { ...plan, prices: plan.prices.map(withYearlyPrice) };
};

/* ── Admin ────────────────────────────────────────────────────────────── */

const listAllPlans = async () => {
  return prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
    include: { prices: true },
  });
};

const createPlan = async ({
  name,
  slug,
  description,
  maxShops,
  maxImagesPerProduct,
  maxDelivererPartners,
  maxProducts,
  maxFeaturedListingsPerMonth,
  supportLevel,
  analyticsLevel,
  sortOrder,
  prices = [],
}) => {
  if (!name?.trim()) throw errors.badRequest("Le nom du plan est requis.");
  if (!slug?.trim()) throw errors.badRequest("Le slug du plan est requis.");

  const existing = await prisma.plan.findUnique({ where: { slug } });
  if (existing) throw errors.badRequest("Un plan avec ce slug existe déjà.");

  return prisma.plan.create({
    data: {
      name: name.trim(),
      slug: slug.trim(),
      description: description?.trim() ?? null,
      maxShops,
      maxImagesPerProduct,
      maxDelivererPartners: maxDelivererPartners ?? null,
      maxProducts: maxProducts ?? null,
      maxFeaturedListingsPerMonth: maxFeaturedListingsPerMonth ?? null,
      supportLevel,
      analyticsLevel,
      sortOrder: sortOrder ?? 0,
      prices: {
        create: prices.map((p) => ({
          country: p.country,
          currency: p.currency,
          priceMonthly: p.priceMonthly,
          isDefault: !!p.isDefault,
        })),
      },
    },
    include: { prices: true },
  });
};

const updatePlan = async (id, data) => {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw errors.notFound("Plan introuvable.");

  const {
    name,
    description,
    maxShops,
    maxImagesPerProduct,
    maxDelivererPartners,
    maxProducts,
    maxFeaturedListingsPerMonth,
    supportLevel,
    analyticsLevel,
    sortOrder,
    isActive,
  } = data;

  return prisma.plan.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && {
        description: description?.trim() ?? null,
      }),
      ...(maxShops !== undefined && { maxShops }),
      ...(maxImagesPerProduct !== undefined && { maxImagesPerProduct }),
      ...(maxDelivererPartners !== undefined && { maxDelivererPartners }),
      ...(maxProducts !== undefined && { maxProducts }),
      ...(maxFeaturedListingsPerMonth !== undefined && {
        maxFeaturedListingsPerMonth,
      }),
      ...(supportLevel !== undefined && { supportLevel }),
      ...(analyticsLevel !== undefined && { analyticsLevel }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { prices: true },
  });
};

const setPlanActiveStatus = async (id, isActive) => {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw errors.notFound("Plan introuvable.");

  return prisma.plan.update({
    where: { id },
    data: { isActive },
  });
};

const upsertPlanPrice = async ({
  planId,
  country,
  currency,
  priceMonthly,
  isDefault,
}) => {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw errors.notFound("Plan introuvable.");

  if (!currency?.trim()) throw errors.badRequest("La devise est requise.");
  if (priceMonthly === undefined || priceMonthly === null) {
    throw errors.badRequest("Le prix mensuel est requis.");
  }

  return prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.planPrice.updateMany({
        where: { planId, country, currency: { not: currency } },
        data: { isDefault: false },
      });
    }

    const price = await tx.planPrice.upsert({
      where: { planId_country_currency: { planId, country, currency } },
      update: { priceMonthly, ...(isDefault !== undefined && { isDefault }) },
      create: {
        planId,
        country,
        currency,
        priceMonthly,
        isDefault: !!isDefault,
      },
    });

    return withYearlyPrice(price);
  });
};

module.exports = {
  listPlans,
  getPlanBySlug,
  listAllPlans,
  createPlan,
  updatePlan,
  setPlanActiveStatus,
  upsertPlanPrice,
};
