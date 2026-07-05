const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { YEARLY_BILLED_MONTHS } = require("../constants/billing.constant");
const { randomUUID } = require("crypto");
const { createOtp, verifyOtp } = require("../../../shared/utils/otp.utils");
const pawapay = require("../../pawapay/services/pawapay.service");
const {
  sendInvoiceEmail,
  sendPaymentFailedEmail,
} = require("../../../services/email.service");
const {
  OTP_TYPES,
  SUBSCRIPTION_ACTIONS,
  LIVE_STATUSES,
} = require("../constants/subscription.constants");

const {
  savePendingAction,
  getPendingAction,
  clearPendingAction,
  saveDepositContext,
  getDepositContext,
  clearDepositContext,
  dispatchOtpToUser,
  resolvePlanPrice,
  computeAmount,
  computeExpiryDate,
  serializeSubscription,
} = require("../utils/subscription.utils");

// ============================= PLANS ======================================

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

// ============================= SUBSCRIPTION ======================================

async function getOwnedSellerProfile(userId, sellerProfileId) {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
  });

  if (!sellerProfile || sellerProfile.userId !== userId) {
    throw errors.forbidden();
  }

  return sellerProfile;
}

async function getPlanOrThrow(planId) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { prices: true },
  });

  if (!plan || !plan.isActive) throw errors.notFound("Plan");

  return plan;
}

async function getCurrentSubscription(sellerProfileId) {
  return prisma.subscription.findFirst({
    where: { sellerProfileId },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });
}

async function beginPendingAction(user, action, actionPayload) {
  const pendingId = randomUUID();
  const code = await createOtp(
    user.id,
    OTP_TYPES.SUBSCRIPTION_ACTION,
    user.email || user.phone,
  );
  const { channel, target } = await dispatchOtpToUser(user, code);

  await savePendingAction(user.id, pendingId, {
    action,
    userId: user.id,
    ...actionPayload,
  });

  return {
    pendingId,
    otpSentVia: channel,
    otpSentTo: maskTarget(channel, target),
  };
}

function maskTarget(channel, target) {
  if (channel === "email") {
    const [local, domain] = target.split("@");
    if (!domain) return target;
    return `${local.slice(0, 2)}***@${domain}`;
  }
  return target.replace(/\d(?=\d{2})/g, "*");
}

async function initiateSubscribe(user, input) {
  const {
    sellerProfileId,
    planId,
    country,
    currency,
    billingCycle,
    phoneNumber,
    provider,
  } = input;

  if (!phoneNumber || !provider) {
    throw errors.badRequest(
      "Le numéro de téléphone et l'opérateur sont requis.",
    );
  }

  await getOwnedSellerProfile(user.id, sellerProfileId);

  const existing = await getCurrentSubscription(sellerProfileId);
  if (existing && LIVE_STATUSES.includes(existing.status)) {
    throw errors.badRequest(
      "Cette boutique a déjà un abonnement actif. Utilisez la mise à niveau.",
    );
  }

  const plan = await getPlanOrThrow(planId);
  const price = resolvePlanPrice(plan, country, currency);
  const amount = computeAmount(price.priceMonthly, billingCycle);

  return beginPendingAction(user, SUBSCRIPTION_ACTIONS.SUBSCRIBE, {
    sellerProfileId,
    planId,
    country,
    currency: price.currency,
    billingCycle,
    amount,
    phoneNumber,
    provider,
  });
}

async function confirmSubscribe(user, { pendingId, otpCode }) {
  await verifyOtp(user.id, OTP_TYPES.SUBSCRIPTION_ACTION, otpCode);
  const pending = await getPendingAction(user.id, pendingId);

  if (pending.action !== SUBSCRIPTION_ACTIONS.SUBSCRIBE) {
    throw errors.badRequest("Cette demande ne correspond pas à un abonnement.");
  }

  // Guard: re-check that no live subscription was created for this shop
  // while the user was entering their OTP (e.g. two concurrent "subscribe"
  // flows, or a double-submitted confirm). Without this, two calls to
  // confirmSubscribe could each pass the earlier initiateSubscribe check
  // and both end up creating a subscription row.
  const alreadyLive = await getCurrentSubscription(pending.sellerProfileId);
  if (alreadyLive && LIVE_STATUSES.includes(alreadyLive.status)) {
    await clearPendingAction(user.id, pendingId);
    throw errors.badRequest(
      "Cette boutique a déjà un abonnement actif. Utilisez la mise à niveau.",
    );
  }

  const deposit = await pawapay.initiateDeposit({
    amount: pending.amount,
    currency: pending.currency,
    phoneNumber: pending.phoneNumber,
    provider: pending.provider,
    metadata: [{ type: "subscription" }, { purpose: "SUBSCRIPTION" }],
  });

  if (!deposit.ok || deposit.data?.status !== "ACCEPTED") {
    await clearPendingAction(user.id, pendingId);
    const reason = deposit.data?.rejectionReason || deposit.data?.failureReason;
    throw errors.badRequest(
      reason?.rejectionMessage ||
        reason?.failureMessage ||
        "La demande de paiement a échoué.",
    );
  }

  const subscription = await prisma.subscription.create({
    data: {
      sellerProfileId: pending.sellerProfileId,
      planId: pending.planId,
      country: pending.country,
      currency: pending.currency,
      amount: pending.amount,
      billingCycle: pending.billingCycle,
      status: "PENDING_PAYMENT",
      pawapayDepositId: deposit.depositId,
      paymentPhoneNumber: pending.phoneNumber,
      paymentProvider: pending.provider,
    },
  });

  await saveDepositContext(deposit.depositId, {
    action: SUBSCRIPTION_ACTIONS.SUBSCRIBE,
    subscriptionId: subscription.id,
    sellerProfileId: pending.sellerProfileId,
    userId: user.id,
  });

  await clearPendingAction(user.id, pendingId);

  return {
    depositId: deposit.depositId,
    subscription: serializeSubscription(subscription),
  };
}

async function initiateUpgrade(user, input) {
  const {
    sellerProfileId,
    planId,
    country,
    currency,
    billingCycle,
    phoneNumber,
    provider,
  } = input;

  if (!phoneNumber || !provider) {
    throw errors.badRequest(
      "Le numéro de téléphone et l'opérateur sont requis.",
    );
  }

  await getOwnedSellerProfile(user.id, sellerProfileId);

  const current = await getCurrentSubscription(sellerProfileId);
  if (!current || !LIVE_STATUSES.includes(current.status)) {
    throw errors.badRequest("Aucun abonnement actif à mettre à niveau.");
  }
  if (current.planId === planId) {
    throw errors.badRequest("Cette boutique est déjà sur ce plan.");
  }

  const plan = await getPlanOrThrow(planId);
  const price = resolvePlanPrice(plan, country, currency);
  const amount = computeAmount(
    price.priceMonthly,
    billingCycle || current.billingCycle,
  );

  return beginPendingAction(user, SUBSCRIPTION_ACTIONS.UPGRADE, {
    sellerProfileId,
    previousSubscriptionId: current.id,
    planId,
    country,
    currency: price.currency,
    billingCycle: billingCycle || current.billingCycle,
    amount,
    phoneNumber,
    provider,
  });
}

async function confirmUpgrade(user, { pendingId, otpCode }) {
  await verifyOtp(user.id, OTP_TYPES.SUBSCRIPTION_ACTION, otpCode);
  const pending = await getPendingAction(user.id, pendingId);

  if (pending.action !== SUBSCRIPTION_ACTIONS.UPGRADE) {
    throw errors.badRequest(
      "Cette demande ne correspond pas à une mise à niveau.",
    );
  }

  // Guard: the subscription targeted for upgrade must still be the
  // seller's current, live subscription. This closes the race where the
  // subscription changed (cancelled, upgraded again, expired) between
  // initiateUpgrade and confirmUpgrade — e.g. the OTP screen was left
  // open and confirm was submitted twice, or another device changed the
  // plan in the meantime.
  const current = await getCurrentSubscription(pending.sellerProfileId);
  if (
    !current ||
    current.id !== pending.previousSubscriptionId ||
    !LIVE_STATUSES.includes(current.status)
  ) {
    await clearPendingAction(user.id, pendingId);
    throw errors.badRequest(
      "L'état de votre abonnement a changé. Merci de réessayer.",
    );
  }

  const deposit = await pawapay.initiateDeposit({
    amount: pending.amount,
    currency: pending.currency,
    phoneNumber: pending.phoneNumber,
    provider: pending.provider,
    metadata: [{ type: "subscription" }, { purpose: "SUBSCRIPTION_UPGRADE" }],
  });

  if (!deposit.ok || deposit.data?.status !== "ACCEPTED") {
    await clearPendingAction(user.id, pendingId);
    const reason = deposit.data?.rejectionReason || deposit.data?.failureReason;
    throw errors.badRequest(
      reason?.rejectionMessage ||
        reason?.failureMessage ||
        "La demande de paiement a échoué.",
    );
  }

  // Update the seller's existing subscription row in place instead of
  // creating a second one. A seller must only ever have ONE row that
  // represents their current plan — otherwise you end up with an old
  // ACTIVE row and a new PENDING_PAYMENT row alive at the same time.
  const subscription = await prisma.subscription.update({
    where: { id: pending.previousSubscriptionId },
    data: {
      planId: pending.planId,
      country: pending.country,
      currency: pending.currency,
      amount: pending.amount,
      billingCycle: pending.billingCycle,
      status: "PENDING_PAYMENT",
      pawapayDepositId: deposit.depositId,
      paymentPhoneNumber: pending.phoneNumber,
      paymentProvider: pending.provider,
    },
  });

  await saveDepositContext(deposit.depositId, {
    action: SUBSCRIPTION_ACTIONS.UPGRADE,
    subscriptionId: subscription.id,
    sellerProfileId: pending.sellerProfileId,
    userId: user.id,
  });

  await clearPendingAction(user.id, pendingId);

  return {
    depositId: deposit.depositId,
    subscription: serializeSubscription(subscription),
  };
}

async function initiateRenew(user, input) {
  const { sellerProfileId, phoneNumber, provider } = input;

  if (!phoneNumber || !provider) {
    throw errors.badRequest(
      "Le numéro de téléphone et l'opérateur sont requis.",
    );
  }

  await getOwnedSellerProfile(user.id, sellerProfileId);

  const current = await getCurrentSubscription(sellerProfileId);
  if (!current) throw errors.notFound("Abonnement");
  if (current.status === "CANCELLED") {
    throw errors.badRequest(
      "Cet abonnement a été annulé. Souscrivez à un nouveau plan.",
    );
  }

  const plan = await getPlanOrThrow(current.planId);
  const price = resolvePlanPrice(plan, current.country, current.currency);
  const amount = computeAmount(price.priceMonthly, current.billingCycle);

  return beginPendingAction(user, SUBSCRIPTION_ACTIONS.RENEW, {
    sellerProfileId,
    previousSubscriptionId: current.id,
    planId: current.planId,
    country: current.country,
    currency: current.currency,
    billingCycle: current.billingCycle,
    amount,
    phoneNumber,
    provider,
  });
}

async function confirmRenew(user, { pendingId, otpCode }) {
  await verifyOtp(user.id, OTP_TYPES.SUBSCRIPTION_ACTION, otpCode);
  const pending = await getPendingAction(user.id, pendingId);

  if (pending.action !== SUBSCRIPTION_ACTIONS.RENEW) {
    throw errors.badRequest(
      "Cette demande ne correspond pas à un renouvellement.",
    );
  }

  // Same race guard as confirmUpgrade: make sure the subscription being
  // renewed is still the seller's current row before touching it.
  const current = await getCurrentSubscription(pending.sellerProfileId);
  if (!current || current.id !== pending.previousSubscriptionId) {
    await clearPendingAction(user.id, pendingId);
    throw errors.badRequest(
      "L'état de votre abonnement a changé. Merci de réessayer.",
    );
  }

  const deposit = await pawapay.initiateDeposit({
    amount: pending.amount,
    currency: pending.currency,
    phoneNumber: pending.phoneNumber,
    provider: pending.provider,
    metadata: [{ type: "subscription" }, { purpose: "SUBSCRIPTION_RENEWAL" }],
  });

  if (!deposit.ok || deposit.data?.status !== "ACCEPTED") {
    await clearPendingAction(user.id, pendingId);
    const reason = deposit.data?.rejectionReason || deposit.data?.failureReason;
    throw errors.badRequest(
      reason?.rejectionMessage ||
        reason?.failureMessage ||
        "La demande de paiement a échoué.",
    );
  }

  // Same row, updated in place — a renewal is not a new subscription.
  const subscription = await prisma.subscription.update({
    where: { id: pending.previousSubscriptionId },
    data: {
      planId: pending.planId,
      country: pending.country,
      currency: pending.currency,
      amount: pending.amount,
      billingCycle: pending.billingCycle,
      status: "PENDING_PAYMENT",
      pawapayDepositId: deposit.depositId,
      paymentPhoneNumber: pending.phoneNumber,
      paymentProvider: pending.provider,
    },
  });

  await saveDepositContext(deposit.depositId, {
    action: SUBSCRIPTION_ACTIONS.RENEW,
    subscriptionId: subscription.id,
    sellerProfileId: pending.sellerProfileId,
    userId: user.id,
  });

  await clearPendingAction(user.id, pendingId);

  return {
    depositId: deposit.depositId,
    subscription: serializeSubscription(subscription),
  };
}

async function cancelSubscription(user, { sellerProfileId }) {
  await getOwnedSellerProfile(user.id, sellerProfileId);

  const current = await getCurrentSubscription(sellerProfileId);
  if (!current || !LIVE_STATUSES.includes(current.status)) {
    throw errors.badRequest("Aucun abonnement actif à annuler.");
  }

  const updated = await prisma.subscription.update({
    where: { id: current.id },
    data: { status: "CANCELLED", cancelledAt: new Date(), autoRenew: false },
    include: { plan: true },
  });

  return serializeSubscription(updated);
}

async function setAutoRenew(user, { sellerProfileId, autoRenew }) {
  await getOwnedSellerProfile(user.id, sellerProfileId);

  const current = await getCurrentSubscription(sellerProfileId);
  if (!current || !LIVE_STATUSES.includes(current.status)) {
    throw errors.badRequest("Aucun abonnement actif.");
  }

  const updated = await prisma.subscription.update({
    where: { id: current.id },
    data: { autoRenew: !!autoRenew },
    include: { plan: true },
  });

  return serializeSubscription(updated);
}

async function getMySubscription(user, { sellerProfileId }) {
  await getOwnedSellerProfile(user.id, sellerProfileId);
  const current = await getCurrentSubscription(sellerProfileId);
  return serializeSubscription(current);
}

async function getAllSubscriptionsAdmin({
  page = 1,
  limit = 20,
  status,
  country,
  planId,
  search,
}) {
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = {
    ...(status && { status }),
    ...(country && { country }),
    ...(planId && { planId }),
    ...(search && {
      sellerProfile: { shopName: { contains: search, mode: "insensitive" } },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        plan: true,
        sellerProfile: { select: { id: true, shopName: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.subscription.count({ where }),
  ]);

  return {
    items: items.map((s) => ({
      ...serializeSubscription(s),
      sellerProfile: s.sellerProfile,
    })),
    pagination: {
      page: Number(page) || 1,
      limit: take,
      total,
      pages: Math.ceil(total / take),
    },
  };
}

const SUCCESS_STATUSES = ["COMPLETED"];
const FAILURE_STATUSES = ["FAILED", "REJECTED"];

async function handleDepositWebhook(callback) {
  const { depositId, status } = callback;
  if (!depositId || !status) return;

  const context = await getDepositContext(depositId);

  const subscription =
    (context &&
      (await prisma.subscription.findUnique({
        where: { id: context.subscriptionId },
        include: { plan: true, sellerProfile: { include: { user: true } } },
      }))) ||
    (await prisma.subscription.findUnique({
      where: { pawapayDepositId: depositId },
      include: { plan: true, sellerProfile: { include: { user: true } } },
    }));

  if (!subscription) return;
  if (subscription.status !== "PENDING_PAYMENT") return;

  if (SUCCESS_STATUSES.includes(status)) {
    const startedAt = new Date();
    const expiresAt = computeExpiryDate(startedAt, subscription.billingCycle);

    // Subscribe, upgrade, and renew all now operate on the same
    // subscription row, so there is no separate "previous" row left to
    // cancel or expire here — just flip this row to ACTIVE.
    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: { status: "ACTIVE", startedAt, expiresAt },
      });

      await tx.sellerProfile.update({
        where: { id: subscription.sellerProfileId },
        data: { onboardingStatus: "ACTIVE" },
      });
    });

    const user = subscription.sellerProfile?.user;
    if (user) {
      await sendInvoiceEmail({
        to: user.email || undefined,
        name: user.name,
        invoice: {
          invoiceNumber: `SUB-${subscription.id.slice(0, 8).toUpperCase()}`,
          type: "SUBSCRIPTION",
          amount: subscription.amount,
          currency: subscription.currency,
          issuedAt: startedAt,
        },
      }).catch(() => {});
    }
  } else if (FAILURE_STATUSES.includes(status)) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELLED" },
    });

    const user = subscription.sellerProfile?.user;
    if (user?.email) {
      await sendPaymentFailedEmail({
        to: user.email,
        name: user.name,
        planName: subscription.plan?.name,
        failureReason: callback?.failureReason?.failureMessage,
      }).catch(() => {});
    }
  }

  await clearDepositContext(depositId);
}

module.exports = {
  listPlans,
  getPlanBySlug,
  listAllPlans,
  createPlan,
  updatePlan,
  setPlanActiveStatus,
  upsertPlanPrice,
  initiateSubscribe,
  confirmSubscribe,
  initiateUpgrade,
  confirmUpgrade,
  initiateRenew,
  confirmRenew,
  cancelSubscription,
  setAutoRenew,
  getMySubscription,
  getAllSubscriptionsAdmin,
  handleDepositWebhook,
};
