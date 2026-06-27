const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { getPlanByTier } = require("./plan.service");
const pawapay = require("./pawapay.service");
const notificationService = require("../../notifications/services/notification.service");
const { issueInvoice } = require("../../invoice/service/invoice.service");
const { sendPaymentFailedEmail } = require("../../../services/email.service");

const resolveAmount = (plan, billingCycle, currency) => {
  if (currency === "USD") {
    return billingCycle === "ANNUAL"
      ? plan.priceUsdAnnual
      : plan.priceUsdMonthly;
  }
  return billingCycle === "ANNUAL" ? plan.priceCdfAnnual : plan.priceCdfMonthly;
};

const computeExpiresAt = (billingCycle) => {
  const now = new Date();
  if (billingCycle === "ANNUAL") {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }
  return new Date(now.setMonth(now.getMonth() + 1));
};

const getSubscription = async ({ userId }) => {
  return prisma.sellerSubscription.findUnique({
    where: { userId },
    include: {
      plan: true,
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
};

const subscribe = async ({
  userId,
  tier,
  billingCycle,
  currency,
  phoneNumber,
  provider,
}) => {
  const plan = await getPlanByTier(tier);
  if (!plan.isActive) throw errors.badRequest("Ce plan n'est plus disponible.");

  const amount = resolveAmount(plan, billingCycle, currency);

  const existing = await prisma.sellerSubscription.findUnique({
    where: { userId },
    include: {
      plan: true,
      payments: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const TIER_ORDER = { STARTER: 1, BUSINESS: 2, ENTERPRISE: 3 };

  // if (existing?.status === "ACTIVE") {
  //   const currentTier = TIER_ORDER[existing.plan.tier];
  //   const newTier = TIER_ORDER[plan.tier];

  //   if (newTier === currentTier) {
  //     throw errors.badRequest(
  //       `Vous êtes déjà sur le plan ${existing.plan.name}.`,
  //     );
  //   }
  //   if (newTier < currentTier) {
  //     throw errors.badRequest(
  //       `La rétrogradation n'est pas autorisée. Votre plan ${existing.plan.name} reste actif jusqu'au ${existing.expiresAt?.toLocaleDateString("fr-FR")}.`,
  //     );
  //   }
  // }

  if (existing?.status === "ACTIVE") {
    const currentTier = TIER_ORDER[existing.plan.tier];
    const newTier = TIER_ORDER[plan.tier];

    if (newTier < currentTier) {
      throw errors.badRequest(
        `La rétrogradation n'est pas autorisée. Votre plan ${existing.plan.name} reste actif jusqu'au ${existing.expiresAt?.toLocaleDateString("fr-FR")}.`,
      );
    }

    if (newTier === currentTier && billingCycle === existing.billingCycle) {
      throw errors.badRequest(
        `Vous êtes déjà sur le plan ${existing.plan.name} en cycle ${billingCycle === "ANNUAL" ? "annuel" : "mensuel"}.`,
      );
    }
  }

  if (existing?.status === "PENDING_PAYMENT" && existing.payments[0]) {
    const pending = existing.payments[0];
    return {
      subscriptionId: existing.id,
      depositId: pending.pawapayDepositId,
      amount: existing.amount,
      currency: existing.currency,
      provider: pending.provider,
      message:
        "Un paiement est déjà en cours. Confirmez sur votre téléphone ou réessayez dans quelques instants.",
    };
  }

  const subscription = existing
    ? await prisma.sellerSubscription.update({
        where: { userId },
        data: {
          planId: plan.id,
          status: "PENDING_PAYMENT",
          billingCycle,
          currency,
          amount,
        },
      })
    : await prisma.sellerSubscription.create({
        data: {
          userId,
          planId: plan.id,
          status: "PENDING_PAYMENT",
          billingCycle,
          currency,
          amount,
        },
      });

  const description = `SwiftGoma ${plan.name} ${billingCycle === "ANNUAL" ? "Annuel" : "Mensuel"}`;
  const deposit = await pawapay.initiateDeposit({
    amount,
    currency,
    provider,
    phoneNumber,
    description,
  });

  if (deposit.status === "REJECTED") {
    const reason = deposit.rejectionReason
      ? typeof deposit.rejectionReason === "object"
        ? JSON.stringify(deposit.rejectionReason)
        : deposit.rejectionReason
      : "Raison inconnue";
    console.error("💳 PawaPay deposit rejected:", deposit.raw);
    throw errors.badRequest(`Paiement refusé : ${reason}.`);
  }

  await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      amount,
      currency,
      provider,
      pawapayDepositId: deposit.depositId,
      phoneNumber,
      status: "PENDING",
      metadata: deposit.raw,
    },
  });

  return {
    subscriptionId: subscription.id,
    depositId: deposit.depositId,
    amount,
    currency,
    provider,
    message: `Une demande de paiement a été envoyée au ${phoneNumber}. Confirmez sur votre téléphone.`,
  };
};

const activateSubscription = async ({ pawapayDepositId, paidAt }) => {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { pawapayDepositId },
    include: { subscription: { include: { plan: true } } },
  });

  if (!payment) throw new Error(`Payment not found: ${pawapayDepositId}`);
  if (payment.status === "COMPLETED") return;

  const { subscription } = payment;
  const expiresAt = computeExpiresAt(subscription.billingCycle);
  const wasUpgrade = subscription.startedAt !== null;

  await prisma.$transaction([
    prisma.subscriptionPayment.update({
      where: { pawapayDepositId },
      data: { status: "COMPLETED", paidAt },
    }),
    prisma.sellerSubscription.update({
      where: { id: subscription.id },
      data: { status: "ACTIVE", startedAt: paidAt ?? new Date(), expiresAt },
    }),
  ]);

  // TODO: reactivate products when products feature is built
  // await prisma.product.updateMany({
  //   where: { sellerProfile: { userId: subscription.userId }, status: "INACTIVE" },
  //   data:  { status: "ACTIVE" },
  // });

  issueInvoice({
    userId: subscription.userId,
    type: "SUBSCRIPTION",
    amount: subscription.amount,
    currency: subscription.currency,
    paidAt: paidAt ?? new Date(),
    referenceId: payment.id,
    referenceType: "subscription_payment",
    items: [
      {
        description: wasUpgrade
          ? `Mise à niveau — ${subscription.plan.name}`
          : `Abonnement ${subscription.plan.name}`,
        note: `${subscription.billingCycle === "ANNUAL" ? "Annuel" : "Mensuel"} — ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
        quantity: 1,
        unitPrice: subscription.amount,
        total: subscription.amount,
      },
    ],
  }).catch((err) => console.error("📄 Invoice error:", err.message));

  notificationService
    .send({
      userId: subscription.userId,
      type: "PAYMENT",
      title: wasUpgrade
        ? `Abonnement mis à jour — ${subscription.plan.name}`
        : `Abonnement ${subscription.plan.name} activé`,
      body: wasUpgrade
        ? `Votre abonnement a été mis à niveau vers ${subscription.plan.name}. Actif jusqu'au ${expiresAt.toLocaleDateString("fr-FR")}.`
        : `Votre abonnement ${subscription.plan.name} est actif jusqu'au ${expiresAt.toLocaleDateString("fr-FR")}.`,
      data: {
        subscriptionId: subscription.id,
        planTier: subscription.plan.tier,
      },
      emailSubject: wasUpgrade
        ? `Mise à niveau — ${subscription.plan.name}`
        : `Abonnement SwiftGoma activé — ${subscription.plan.name}`,
      emailBody: wasUpgrade
        ? `Votre abonnement a été mis à niveau vers ${subscription.plan.name}. Il est actif jusqu'au ${expiresAt.toLocaleDateString("fr-FR")}.`
        : `Votre abonnement ${subscription.plan.name} est maintenant actif jusqu'au ${expiresAt.toLocaleDateString("fr-FR")}.`,
    })
    .catch(() => {});
};

const failPayment = async ({ pawapayDepositId, failureReason, failedAt }) => {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { pawapayDepositId },
    include: { subscription: { include: { plan: true } } },
  });

  if (!payment || payment.status !== "PENDING") return;

  const user = await prisma.user.findUnique({
    where: { id: payment.subscription.userId },
    select: { email: true, name: true },
  });

  await prisma.subscriptionPayment.update({
    where: { pawapayDepositId },
    data: {
      status: "FAILED",
      failedAt: failedAt ?? new Date(),
      failureReason: failureReason ?? null,
    },
  });

  notificationService
    .send({
      userId: payment.subscription.userId,
      type: "PAYMENT",
      title: "Paiement échoué",
      body: `Le paiement pour ${payment.subscription.plan.name} a échoué${failureReason ? ` : ${failureReason}` : ""}. Réessayez.`,
      data: { subscriptionId: payment.subscriptionId },
    })
    .catch(() => {});

  if (user?.email) {
    sendPaymentFailedEmail({
      to: user.email,
      name: user.name,
      planName: payment.subscription.plan.name,
      failureReason: failureReason ?? null,
    }).catch(() => {});
  }
};

const cancelSubscription = async ({ userId }) => {
  const subscription = await prisma.sellerSubscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!subscription) throw errors.badRequest("Aucun abonnement trouvé.");
  if (subscription.status !== "ACTIVE")
    throw errors.badRequest("Cet abonnement n'est pas actif.");

  await prisma.sellerSubscription.update({
    where: { userId },
    data: { status: "CANCELLED", autoRenew: false, cancelledAt: new Date() },
  });

  notificationService
    .send({
      userId,
      type: "ACCOUNT",
      title: "Abonnement annulé",
      body: `Votre abonnement ${subscription.plan.name} a été annulé. Il reste actif jusqu'au ${subscription.expiresAt?.toLocaleDateString("fr-FR")}.`,
    })
    .catch(() => {});

  return true;
};

const checkLimit = async ({ userId, resource }) => {
  const subscription = await prisma.sellerSubscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!subscription || subscription.status !== "ACTIVE") {
    throw errors.badRequest(
      "Vous devez avoir un abonnement actif pour effectuer cette action.",
    );
  }

  if (subscription.expiresAt && subscription.expiresAt < new Date()) {
    await prisma.sellerSubscription.update({
      where: { userId },
      data: { status: "EXPIRED" },
    });
    throw errors.badRequest(
      "Votre abonnement a expiré. Renouvelez-le pour continuer.",
    );
  }

  const limit = subscription.plan[resource];
  if (limit === undefined) throw new Error(`Limite inconnue : ${resource}`);

  return {
    allowed: limit === -1,
    limit,
    plan: subscription.plan,
    subscription,
  };
};

const autoRenewSubscription = async (subscription) => {
  const lastPayment = await prisma.subscriptionPayment.findFirst({
    where: { subscriptionId: subscription.id, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });

  if (!lastPayment) {
    await prisma.sellerSubscription.update({
      where: { id: subscription.id },
      data: { autoRenew: false },
    });
    notificationService
      .send({
        userId: subscription.userId,
        type: "ACCOUNT",
        title: "Renouvellement automatique désactivé",
        body: `Impossible de renouveler votre abonnement ${subscription.plan.name} automatiquement. Aucun moyen de paiement trouvé. Renouvelez manuellement.`,
      })
      .catch(() => {});
    return;
  }

  try {
    const description = `SwiftGoma ${subscription.plan.name} Renouvellement`;
    const deposit = await pawapay.initiateDeposit({
      amount: subscription.amount,
      currency: subscription.currency,
      provider: lastPayment.provider,
      phoneNumber: lastPayment.phoneNumber,
      description,
    });

    if (deposit.status === "REJECTED") {
      await prisma.sellerSubscription.update({
        where: { id: subscription.id },
        data: { autoRenew: false },
      });
      notificationService
        .send({
          userId: subscription.userId,
          type: "PAYMENT",
          title: "Renouvellement automatique échoué",
          body: `Le renouvellement de votre abonnement ${subscription.plan.name} a échoué. Renouvelez manuellement pour continuer à vendre.`,
          data: { subscriptionId: subscription.id },
        })
        .catch(() => {});
      return;
    }

    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        amount: subscription.amount,
        currency: subscription.currency,
        provider: lastPayment.provider,
        pawapayDepositId: deposit.depositId,
        phoneNumber: lastPayment.phoneNumber,
        status: "PENDING",
        metadata: deposit.raw,
      },
    });

    notificationService
      .send({
        userId: subscription.userId,
        type: "PAYMENT",
        title: "Renouvellement en cours",
        body: `Une demande de renouvellement de votre abonnement ${subscription.plan.name} a été envoyée au ${lastPayment.phoneNumber}. Confirmez sur votre téléphone.`,
        data: { subscriptionId: subscription.id },
      })
      .catch(() => {});

    console.log(`🔄 Auto-renew initiated for subscription ${subscription.id}`);
  } catch (err) {
    console.error(`🔄 Auto-renew error for ${subscription.id}:`, err.message);
  }
};

const checkExpiringSubscriptions = async () => {
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const toRenew = await prisma.sellerSubscription.findMany({
    where: {
      status: "ACTIVE",
      autoRenew: true,
      expiresAt: { lte: in3Days, gte: now },
      payments: { none: { status: "PENDING" } },
    },
    include: { plan: true },
  });

  for (const sub of toRenew) {
    console.log(
      `Auto-renewing subscription ${sub.id} (expires ${sub.expiresAt?.toLocaleDateString("fr-FR")})`,
    );
    await autoRenewSubscription(sub);
  }

  const expiringSoon = await prisma.sellerSubscription.findMany({
    where: {
      status: "ACTIVE",
      autoRenew: false,
      expiresAt: { lte: in3Days, gte: now },
    },
    include: { plan: true },
  });

  for (const sub of expiringSoon) {
    notificationService
      .send({
        userId: sub.userId,
        type: "ACCOUNT",
        title: "Abonnement bientôt expiré",
        body: `Votre abonnement ${sub.plan.name} expire le ${sub.expiresAt?.toLocaleDateString("fr-FR")}. Renouvelez pour continuer à vendre.`,
        data: { subscriptionId: sub.id },
      })
      .catch(() => {});
  }

  const expired = await prisma.sellerSubscription.findMany({
    where: { status: "ACTIVE", expiresAt: { lt: now } },
    include: { plan: true },
  });

  for (const sub of expired) {
    await prisma.sellerSubscription.update({
      where: { id: sub.id },
      data: { status: "EXPIRED" },
    });

    notificationService
      .send({
        userId: sub.userId,
        type: "ACCOUNT",
        title: "Abonnement expiré",
        body: `Votre abonnement ${sub.plan.name} a expiré. Vos produits ne sont plus visibles. Renouvelez pour les réactiver.`,
        emailSubject: `Abonnement SwiftGoma expiré — ${sub.plan.name}`,
        emailBody: `Votre abonnement ${sub.plan.name} a expiré. Vos produits ont été désactivés. Renouvelez pour les réactiver.`,
      })
      .catch(() => {});

    // TODO: uncomment when products feature is built
    // await prisma.product.updateMany({
    //   where: { sellerProfile: { userId: sub.userId }, status: "ACTIVE" },
    //   data:  { status: "INACTIVE" },
    // });
  }

  console.log(
    `✅ Subscription check: ${toRenew.length} renewed, ${expiringSoon.length} warned, ${expired.length} expired`,
  );
};

module.exports = {
  getSubscription,
  subscribe,
  activateSubscription,
  failPayment,
  cancelSubscription,
  checkLimit,
  autoRenewSubscription,
  checkExpiringSubscriptions,
};
