const { getPrismaClient } = require("../src/config/prisma");

function guardProduction() {
  const isProd = process.env.NODE_ENV === "production";
  const allowed = process.env.ALLOW_PROD_SEED === "true";

  if (isProd && !allowed) {
    console.error(
      "\nRefusing to run: NODE_ENV=production without ALLOW_PROD_SEED=true.\n" +
        "If you really mean to seed plans in production, re-run as:\n" +
        "  ALLOW_PROD_SEED=true NODE_ENV=production npm run seed:plans\n",
    );
    process.exit(1);
  }

  if (isProd && allowed) {
    console.warn(
      "\n⚠️  Running against PRODUCTION (ALLOW_PROD_SEED=true). Proceed carefully.\n",
    );
  }
}

const YEARLY_DISCOUNT_PERCENT = 15;
const CDF_PER_USD = 2300;

const PLANS = [
  {
    slug: "starter",
    name: "Starter",
    maxProducts: 20,
    maxPhotosPerProduct: 3,
    maxShops: 1,
    prioritySupport: false,
    sortOrder: 1,
    monthlyUsd: 10,
  },
  {
    slug: "business",
    name: "Business",
    maxProducts: 100,
    maxPhotosPerProduct: 6,
    maxShops: 1,
    prioritySupport: false,
    sortOrder: 2,
    monthlyUsd: 15,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    maxProducts: 1000,
    maxPhotosPerProduct: 10,
    maxShops: 3,
    prioritySupport: true,
    sortOrder: 3,
    monthlyUsd: 25,
  },
];

function round2(num) {
  return Math.round(num * 100) / 100;
}

function computePrices(monthlyUsd) {
  const yearlyUsd = round2(
    monthlyUsd * 12 * (1 - YEARLY_DISCOUNT_PERCENT / 100),
  );
  const monthlyCdf = Math.round(monthlyUsd * CDF_PER_USD);
  const yearlyCdf = Math.round(yearlyUsd * CDF_PER_USD);

  return [
    { billingCycle: "MONTHLY", currency: "USD", amount: monthlyUsd },
    { billingCycle: "YEARLY", currency: "USD", amount: yearlyUsd },
    { billingCycle: "MONTHLY", currency: "CDF", amount: monthlyCdf },
    { billingCycle: "YEARLY", currency: "CDF", amount: yearlyCdf },
  ];
}

async function main() {
  guardProduction();

  const prisma = getPrismaClient();

  for (const planDef of PLANS) {
    const plan = await prisma.plan.upsert({
      where: { slug: planDef.slug },
      update: {
        name: planDef.name,
        maxProducts: planDef.maxProducts,
        maxPhotosPerProduct: planDef.maxPhotosPerProduct,
        maxShops: planDef.maxShops,
        prioritySupport: planDef.prioritySupport,
        sortOrder: planDef.sortOrder,
        isActive: true,
      },
      create: {
        slug: planDef.slug,
        name: planDef.name,
        maxProducts: planDef.maxProducts,
        maxPhotosPerProduct: planDef.maxPhotosPerProduct,
        maxShops: planDef.maxShops,
        prioritySupport: planDef.prioritySupport,
        sortOrder: planDef.sortOrder,
      },
    });

    const prices = computePrices(planDef.monthlyUsd);

    for (const price of prices) {
      await prisma.planPrice.upsert({
        where: {
          planId_billingCycle_currency: {
            planId: plan.id,
            billingCycle: price.billingCycle,
            currency: price.currency,
          },
        },
        update: { amount: price.amount },
        create: {
          planId: plan.id,
          billingCycle: price.billingCycle,
          currency: price.currency,
          amount: price.amount,
        },
      });
    }

    console.log(
      `✅ ${planDef.name} (${planDef.slug}) — ${prices.length} prix synchronisés`,
    );
  }

  console.log("\nSeed terminé.");

  const cache = require("../src/common/services/cache");
  if (cache.isAvailable()) {
    await cache.clearNamespace("plans");
    console.log("Cache plans invalidé.");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ Erreur pendant le seed des plans:", err);
  const { getPrismaClient } = require("../src/config/prisma");
  await getPrismaClient().$disconnect();
  process.exit(1);
});
