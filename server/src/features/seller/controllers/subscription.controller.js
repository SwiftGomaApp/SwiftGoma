const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const planService = require("../services/plan.service");
const subscriptionService = require("../services/subscription.service");

const listPlans = catchAsync(async (req, res) => {
  const plans = await planService.listPlans();
  res.status(200).json({ success: true, data: plans });
});

const getPlan = catchAsync(async (req, res) => {
  const plan = await planService.getPlanByTier(req.params.tier.toUpperCase());
  res.status(200).json({ success: true, data: plan });
});

const updatePlan = catchAsync(async (req, res) => {
  const plan = await planService.updatePlan(
    req.params.tier.toUpperCase(),
    req.body,
  );
  res
    .status(200)
    .json({ success: true, message: "Plan mis à jour.", data: plan });
});

const getSubscription = catchAsync(async (req, res) => {
  const subscription = await subscriptionService.getSubscription({
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: subscription });
});

const subscribe = catchAsync(async (req, res) => {
  const { tier, billingCycle, currency, phoneNumber, provider } = req.body;

  if (!tier) throw errors.badRequest("Le plan est requis.");
  if (!billingCycle)
    throw errors.badRequest("Le cycle de facturation est requis.");
  if (!currency) throw errors.badRequest("La devise est requise.");
  if (!phoneNumber)
    throw errors.badRequest("Le numéro de téléphone est requis.");
  if (!provider)
    throw errors.badRequest("L'opérateur Mobile Money est requis.");

  const result = await subscriptionService.subscribe({
    userId: req.user.id,
    tier: tier.toUpperCase(),
    billingCycle: billingCycle.toUpperCase(),
    currency: currency.toUpperCase(),
    phoneNumber,
    provider: provider.toUpperCase(),
  });

  res
    .status(200)
    .json({ success: true, message: result.message, data: result });
});

const cancelSubscription = catchAsync(async (req, res) => {
  await subscriptionService.cancelSubscription({ userId: req.user.id });
  res.status(200).json({
    success: true,
    message:
      "Abonnement annulé. Il reste actif jusqu'à la fin de la période en cours.",
  });
});

const adminListSubscriptions = catchAsync(async (req, res) => {
  const { prisma } = require("../../../config/db.config");
  const { page, limit, status } = req.query;
  const skip = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
  const where = status ? { status } : {};

  const [subscriptions, total] = await Promise.all([
    prisma.sellerSubscription.findMany({
      where,
      include: {
        plan: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit) || 20,
    }),
    prisma.sellerSubscription.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: { subscriptions, pagination: { total, page: parseInt(page) || 1 } },
  });
});

module.exports = {
  listPlans,
  getPlan,
  updatePlan,
  getSubscription,
  subscribe,
  cancelSubscription,
  adminListSubscriptions,
};
