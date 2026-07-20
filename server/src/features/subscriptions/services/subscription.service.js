const { getPrismaClient } = require("../../../config/prisma");
const { env } = require("../../../config/env");
const { NotFoundError, ConflictError } = require("../../../common/errors");
const {
  calculatePeriodEnd,
  isSubscriptionActive,
  assertValidStatusTransition,
  resolvePlanPrice,
} = require("../utils/subscription.utils");
const { initiateDeposit } = require("../../payments/services/pawapay.service");
const {
  createNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");
const {
  subscriptionStatusEmail,
} = require("../../../common/emails/templates/subscriptionStatus");

const prisma = getPrismaClient();

async function assertSellerProfileExists(sellerProfileId) {
  const profile = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
  });
  if (!profile) throw new NotFoundError("Profil vendeur introuvable.");
  return profile;
}

async function getPlanOrThrow(planId) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { prices: true },
  });
  if (!plan) throw new NotFoundError("Plan introuvable.");
  if (!plan.isActive) throw new ConflictError("Ce plan n'est plus disponible.");
  return plan;
}

async function subscribeToPlan({
  sellerProfileId,
  planId,
  billingCycle,
  currency,
  payerPhoneNumber,
  country,
  provider,
}) {
  await assertSellerProfileExists(sellerProfileId);
  const plan = await getPlanOrThrow(planId);
  const price = resolvePlanPrice(plan, billingCycle, currency);

  const existing = await prisma.subscription.findUnique({
    where: { sellerProfileId },
  });

  if (existing) {
    if (isSubscriptionActive(existing)) {
      throw new ConflictError(
        "Ce vendeur a déjà une subscription active. Utilisez l'upgrade à la place.",
      );
    }
    if (existing.status === "PENDING_PAYMENT") {
      throw new ConflictError(
        "Un paiement est déjà en attente pour ce vendeur. Attendez sa confirmation ou son échec avant de relancer une souscription.",
      );
    }
  }

  const periodStart = new Date();
  const periodEnd = calculatePeriodEnd(periodStart, billingCycle);

  const subscription = existing
    ? await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          planId: plan.id,
          billingCycle,
          currency,
          status: "PENDING_PAYMENT",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          autoRenew: true,
          canceledAt: null,
        },
      })
    : await prisma.subscription.create({
        data: {
          sellerProfileId,
          planId: plan.id,
          billingCycle,
          currency,
          status: "PENDING_PAYMENT",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });

  const payment = await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      planId: plan.id,
      billingCycle,
      currency,
      amount: price.amount,
      status: "PENDING",
      periodStart,
      periodEnd,
    },
  });

  try {
    const deposit = await initiateDeposit({
      amount: price.amount,
      currency,
      country,
      provider,
      payerPhoneNumber,
      customerMessage: `Abonnement ${plan.name}`,
      clientReferenceId: payment.id,
      metadata: {
        type: "SUBSCRIPTION",
        subscriptionId: subscription.id,
        subscriptionPaymentId: payment.id,
        sellerProfileId,
      },
    });

    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { depositId: deposit.depositId },
    });

    return {
      subscription,
      payment: { ...payment, depositId: deposit.depositId },
      deposit,
    };
  } catch (err) {
    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: err.message },
    });
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "FAILED_PAYMENT" },
    });
    throw err;
  }
}

async function upgradeSubscription({
  sellerProfileId,
  newPlanId,
  billingCycle,
  currency,
  payerPhoneNumber,
  country,
  provider,
}) {
  await assertSellerProfileExists(sellerProfileId);

  const subscription = await prisma.subscription.findUnique({
    where: { sellerProfileId },
  });
  if (!subscription) {
    throw new NotFoundError("Aucune subscription trouvée pour ce vendeur.");
  }
  if (subscription.status !== "ACTIVE") {
    throw new ConflictError(
      "Seule une subscription active peut être upgradée.",
    );
  }
  if (subscription.planId === newPlanId) {
    throw new ConflictError("Vous êtes déjà sur ce plan.");
  }
  if (currency !== subscription.currency) {
    throw new ConflictError(
      "Le changement de devise n'est pas pris en charge lors d'un upgrade. Utilisez la devise actuelle de votre abonnement.",
    );
  }

  const currentPlan = await getPlanOrThrow(subscription.planId);
  const newPlan = await getPlanOrThrow(newPlanId);

  const currentPrice = resolvePlanPrice(
    currentPlan,
    subscription.billingCycle,
    subscription.currency,
  );
  const newPrice = resolvePlanPrice(newPlan, billingCycle, currency);

  if (Number(newPrice.amount) <= Number(currentPrice.amount)) {
    throw new ConflictError(
      "Le nouveau plan doit être plus cher que le plan actuel pour être considéré comme un upgrade.",
    );
  }

  const periodStart = new Date();
  const periodEnd = calculatePeriodEnd(periodStart, billingCycle);

  const payment = await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      planId: newPlan.id,
      billingCycle,
      currency,
      amount: newPrice.amount,
      status: "PENDING",
      periodStart,
      periodEnd,
    },
  });

  try {
    const deposit = await initiateDeposit({
      amount: newPrice.amount,
      currency,
      country,
      provider,
      payerPhoneNumber,
      customerMessage: `Upgrade vers ${newPlan.name}`,
      clientReferenceId: payment.id,
      metadata: {
        type: "SUBSCRIPTION",
        subscriptionId: subscription.id,
        subscriptionPaymentId: payment.id,
        sellerProfileId,
        isUpgrade: "true",
      },
    });

    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { depositId: deposit.depositId },
    });

    // La subscription elle-même ne change de plan qu'une fois le paiement
    // confirmé — voir confirmSubscriptionPayment, qui applique payment.planId
    // et les nouvelles dates de période sur la Subscription.
    return {
      subscription,
      payment: { ...payment, depositId: deposit.depositId },
      deposit,
    };
  } catch (err) {
    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: err.message },
    });
    throw err;
  }
}

async function confirmSubscriptionPayment(depositId) {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { depositId },
    include: {
      subscription: {
        include: { sellerProfile: { include: { user: true } } },
      },
      plan: true,
    },
  });
  if (!payment) {
    throw new NotFoundError(
      "Aucun paiement de subscription trouvé pour ce depositId.",
    );
  }
  if (payment.status === "SUCCEEDED") {
    return { payment, subscription: payment.subscription }; // idempotent — déjà confirmé
  }

  const updatedPayment = await prisma.subscriptionPayment.update({
    where: { id: payment.id },
    data: { status: "SUCCEEDED", paidAt: new Date() },
  });

  // Applique le plan/cycle/devise/période de CE paiement à la subscription —
  // fonctionne aussi bien pour une souscription initiale que pour un upgrade,
  // puisque payment.planId contient déjà le bon plan dans les deux cas.
  const updatedSubscription = await prisma.subscription.update({
    where: { id: payment.subscriptionId },
    data: {
      status: "ACTIVE",
      planId: payment.planId,
      billingCycle: payment.billingCycle,
      currency: payment.currency,
      currentPeriodStart: payment.periodStart,
      currentPeriodEnd: payment.periodEnd,
    },
  });

  try {
    const userId = payment.subscription.sellerProfile.user.id;
    const periodEndLabel = payment.periodEnd.toLocaleDateString("fr-FR");

    const emailContent = subscriptionStatusEmail({
      name: payment.subscription.sellerProfile.businessName,
      action: "paymentSucceeded",
      planName: payment.plan.name,
      periodEnd: periodEndLabel,
      actionUrl: `${env.appUrl}/seller/dashboard`,
      locale: "fr",
    });

    await createNotification({
      userId,
      type: NOTIFICATION_TYPES.PAYMENT,
      title: emailContent.subject,
      body: `Votre abonnement ${payment.plan.name} est actif jusqu'au ${periodEndLabel}.`,
      data: {
        action: "subscriptionPaymentSucceeded",
        subscriptionId: payment.subscriptionId,
      },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error(
      "[subscription] Failed to notify payment-succeeded:",
      err.message,
    );
  }

  return { payment: updatedPayment, subscription: updatedSubscription };
}

async function failSubscriptionPayment(depositId, failureReason) {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { depositId },
    include: {
      subscription: {
        include: { sellerProfile: { include: { user: true } } },
      },
      plan: true,
    },
  });
  if (!payment) {
    throw new NotFoundError(
      "Aucun paiement de subscription trouvé pour ce depositId.",
    );
  }
  if (payment.status === "FAILED") {
    return { payment, subscription: payment.subscription }; // idempotent
  }

  const updatedPayment = await prisma.subscriptionPayment.update({
    where: { id: payment.id },
    data: { status: "FAILED", failureReason },
  });

  // Un échec d'upgrade ne doit PAS casser la subscription active existante —
  // seulement un échec de souscription initiale (PENDING_PAYMENT) doit
  // faire tomber la subscription en FAILED_PAYMENT.
  const wasInitialSubscription =
    payment.subscription.status === "PENDING_PAYMENT";

  const updatedSubscription = wasInitialSubscription
    ? await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: "FAILED_PAYMENT" },
      })
    : payment.subscription;

  try {
    const userId = payment.subscription.sellerProfile.user.id;

    const emailContent = subscriptionStatusEmail({
      name: payment.subscription.sellerProfile.businessName,
      action: "paymentFailed",
      planName: payment.plan.name,
      actionUrl: `${env.appUrl}/seller/subscription`,
      locale: "fr",
    });

    await createNotification({
      userId,
      type: NOTIFICATION_TYPES.PAYMENT,
      title: emailContent.subject,
      body: `Le paiement pour votre abonnement ${payment.plan.name} a échoué. Merci de réessayer.`,
      data: {
        action: "subscriptionPaymentFailed",
        subscriptionId: payment.subscriptionId,
      },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error(
      "[subscription] Failed to notify payment-failed:",
      err.message,
    );
  }

  return { payment: updatedPayment, subscription: updatedSubscription };
}

async function getSubscriptionBySellerId(sellerProfileId) {
  const subscription = await prisma.subscription.findUnique({
    where: { sellerProfileId },
    include: {
      plan: { include: { prices: true } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!subscription) {
    throw new NotFoundError("Aucune subscription trouvée pour ce vendeur.");
  }
  return subscription;
}

async function listPaymentHistory(
  sellerProfileId,
  { page = 1, limit = 20 } = {},
) {
  const subscription = await prisma.subscription.findUnique({
    where: { sellerProfileId },
  });
  if (!subscription) {
    throw new NotFoundError("Aucune subscription trouvée pour ce vendeur.");
  }

  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const [total, payments] = await prisma.$transaction([
    prisma.subscriptionPayment.count({
      where: { subscriptionId: subscription.id },
    }),
    prisma.subscriptionPayment.findMany({
      where: { subscriptionId: subscription.id },
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: { plan: { select: { name: true, slug: true } } },
    }),
  ]);

  return {
    payments,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

async function cancelSubscription(sellerProfileId) {
  const subscription = await prisma.subscription.findUnique({
    where: { sellerProfileId },
    include: { sellerProfile: { include: { user: true } }, plan: true },
  });
  if (!subscription) {
    throw new NotFoundError("Aucune subscription trouvée pour ce vendeur.");
  }

  assertValidStatusTransition(subscription.status, "CANCELED");

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "CANCELED", autoRenew: false, canceledAt: new Date() },
  });

  try {
    const userId = subscription.sellerProfile.user.id;
    const periodEndLabel =
      subscription.currentPeriodEnd.toLocaleDateString("fr-FR");

    const emailContent = subscriptionStatusEmail({
      name: subscription.sellerProfile.businessName,
      action: "canceled",
      planName: subscription.plan.name,
      periodEnd: periodEndLabel,
      actionUrl: `${env.appUrl}/seller/subscription`,
      locale: "fr",
    });

    await createNotification({
      userId,
      type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
      title: emailContent.subject,
      body: `Votre abonnement ${subscription.plan.name} a été annulé. Vous garderez l'accès jusqu'au ${periodEndLabel}.`,
      data: { action: "subscriptionCanceled" },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[subscription] Failed to notify cancellation:", err.message);
  }

  return updated;
}

async function reactivateCanceledSubscription(sellerProfileId) {
  const subscription = await prisma.subscription.findUnique({
    where: { sellerProfileId },
    include: { sellerProfile: { include: { user: true } }, plan: true },
  });
  if (!subscription) {
    throw new NotFoundError("Aucune subscription trouvée pour ce vendeur.");
  }
  if (subscription.status !== "CANCELED") {
    throw new ConflictError(
      "Cette subscription n'est pas annulée, rien à réactiver.",
    );
  }
  if (new Date(subscription.currentPeriodEnd) <= new Date()) {
    throw new ConflictError(
      "La période payée est déjà terminée. Veuillez souscrire à nouveau.",
    );
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "ACTIVE", autoRenew: true, canceledAt: null },
  });

  try {
    const userId = subscription.sellerProfile.user.id;
    const periodEndLabel =
      subscription.currentPeriodEnd.toLocaleDateString("fr-FR");

    const emailContent = subscriptionStatusEmail({
      name: subscription.sellerProfile.businessName,
      action: "reactivated",
      planName: subscription.plan.name,
      periodEnd: periodEndLabel,
      actionUrl: `${env.appUrl}/seller/dashboard`,
      locale: "fr",
    });

    await createNotification({
      userId,
      type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
      title: emailContent.subject,
      body: `Votre abonnement ${subscription.plan.name} est de nouveau actif jusqu'au ${periodEndLabel}.`,
      data: { action: "subscriptionReactivated" },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[subscription] Failed to notify reactivation:", err.message);
  }

  return updated;
}

async function getSubscriptionStats() {
  const [statusCounts, planBreakdown, revenueByCurrency, recentPayments] =
    await Promise.all([
      prisma.subscription.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.subscription.groupBy({
        by: ["planId"],
        where: { status: "ACTIVE" },
        _count: { _all: true },
      }),
      prisma.subscriptionPayment.groupBy({
        by: ["currency"],
        where: { status: "SUCCEEDED" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.subscriptionPayment.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          plan: { select: { name: true, slug: true } },
          subscription: {
            select: {
              sellerProfile: { select: { businessName: true } },
            },
          },
        },
      }),
    ]);

  const planIds = planBreakdown.map((p) => p.planId);
  const plans = await prisma.plan.findMany({
    where: { id: { in: planIds } },
    select: { id: true, name: true, slug: true },
  });
  const planMap = new Map(plans.map((p) => [p.id, p]));

  const byStatus = statusCounts.reduce((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  const byPlan = planBreakdown.map((row) => ({
    planId: row.planId,
    planName: planMap.get(row.planId)?.name ?? "Plan supprimé",
    planSlug: planMap.get(row.planId)?.slug ?? null,
    activeCount: row._count._all,
  }));

  const revenue = revenueByCurrency.map((row) => ({
    currency: row.currency,
    totalCollected: row._sum.amount,
    paymentCount: row._count._all,
  }));

  return {
    totalSubscriptions: statusCounts.reduce(
      (sum, row) => sum + row._count._all,
      0,
    ),
    byStatus: {
      PENDING_PAYMENT: byStatus.PENDING_PAYMENT ?? 0,
      ACTIVE: byStatus.ACTIVE ?? 0,
      FAILED_PAYMENT: byStatus.FAILED_PAYMENT ?? 0,
      PAST_DUE: byStatus.PAST_DUE ?? 0,
      EXPIRED: byStatus.EXPIRED ?? 0,
      CANCELED: byStatus.CANCELED ?? 0,
    },
    activeByPlan: byPlan,
    revenueByCurrency: revenue,
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      businessName: p.subscription.sellerProfile.businessName,
      planName: p.plan.name,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
    })),
  };
}

module.exports = {
  subscribeToPlan,
  upgradeSubscription,
  confirmSubscriptionPayment,
  failSubscriptionPayment,
  getSubscriptionBySellerId,
  listPaymentHistory,
  cancelSubscription,
  reactivateCanceledSubscription,
  getSubscriptionStats,
};
