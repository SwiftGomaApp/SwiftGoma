const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");

const DEFAULT_PLANS = [
  {
    tier: "STARTER",
    name: "Starter",
    description:
      "Parfait pour démarrer votre boutique en ligne à Goma. 1 boutique, 20 produits, 3 images par produit.",
    priceCdfMonthly: 25000,
    priceCdfAnnual: 250000,
    priceUsdMonthly: 10,
    priceUsdAnnual: 100,
    maxShops: 1,
    maxProducts: 20,
    maxImagesPerProduct: 3,
    maxVariants: 2,
    maxFeaturedProducts: 0,
    canFeatureProducts: false,
    analyticsRetentionDays: 7,
    hasPrioritySupport: false,
  },
  {
    tier: "BUSINESS",
    name: "Business",
    description:
      "Pour les vendeurs en croissance. 3 boutiques, 100 produits, 8 images par produit et produits en vedette.",
    priceCdfMonthly: 37500,
    priceCdfAnnual: 375000,
    priceUsdMonthly: 15,
    priceUsdAnnual: 150,
    maxShops: 3,
    maxProducts: 100,
    maxImagesPerProduct: 8,
    maxVariants: 10,
    maxFeaturedProducts: 3,
    canFeatureProducts: true,
    analyticsRetentionDays: 30,
    hasPrioritySupport: false,
  },
  {
    tier: "ENTERPRISE",
    name: "Enterprise",
    description:
      "Pour les grandes boutiques sans limites. Boutiques, produits et variantes illimités, support prioritaire inclus.",
    priceCdfMonthly: 62500,
    priceCdfAnnual: 625000,
    priceUsdMonthly: 25,
    priceUsdAnnual: 250,
    maxShops: -1,
    maxProducts: -1,
    maxImagesPerProduct: 20,
    maxVariants: -1,
    maxFeaturedProducts: -1,
    canFeatureProducts: true,
    analyticsRetentionDays: 90,
    hasPrioritySupport: true,
  },
];

const seedPlans = async () => {
  for (const plan of DEFAULT_PLANS) {
    await prisma.sellerPlan.upsert({
      where: { tier: plan.tier },
      create: plan,
      update: {
        name: plan.name,
        description: plan.description,
        priceCdfMonthly: plan.priceCdfMonthly,
        priceCdfAnnual: plan.priceCdfAnnual,
        priceUsdMonthly: plan.priceUsdMonthly,
        priceUsdAnnual: plan.priceUsdAnnual,
        analyticsRetentionDays: plan.analyticsRetentionDays,
        hasPrioritySupport: plan.hasPrioritySupport,
      },
    });
  }
  console.log("Seller plans seeded");
};

const listPlans = async () => {
  return prisma.sellerPlan.findMany({
    where: { isActive: true },
    orderBy: { priceCdfMonthly: "asc" },
  });
};

const getPlanByTier = async (tier) => {
  const plan = await prisma.sellerPlan.findUnique({ where: { tier } });
  if (!plan) throw errors.badRequest("Plan introuvable");
  return plan;
};

const updatePlan = async (tier, updates) => {
  const plan = await prisma.sellerPlan.findUnique({ where: { tier } });
  if (!plan) throw errors.badRequest("Plan introuvable.");

  const allowed = [
    "priceCdfMonthly",
    "priceCdfAnnual",
    "priceUsdMonthly",
    "priceUsdAnnual",
    "maxShops",
    "maxProducts",
    "maxImagesPerProduct",
    "maxVariants",
    "maxFeaturedProducts",
    "canFeatureProducts",
    "analyticsRetentionDays",
    "hasPrioritySupport",
    "isActive",
  ];

  const data = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k)),
  );

  return prisma.sellerPlan.update({ where: { tier }, data });
};

module.exports = { seedPlans, listPlans, getPlanByTier, updatePlan };
