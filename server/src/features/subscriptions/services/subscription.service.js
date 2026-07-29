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

const {
  generateInvoiceDocument,
  generateReceiptDocument,
} = require("../../invoicing/services/invoice.service");
const { formatDate } = require("../../invoicing/utils/invoicing.utils");
const { createQueue } = require("../../../config/queue");
const { QUEUE_NAMES } = require("../../../common/constants/queueNames");

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

const { SUBSCRIPTION_CONFIG } = require("../config/subscription.config");

// Body text differs slightly depending on which flow triggered the
// invoice (new subscription / upgrade / renewal) — everything else
// about generating and emailing the invoice is identical, so this is
// the only thing that varies between the three former call sites.
const INVOICE_BODY_BY_KIND = {
  subscription: (planName) =>
    `Votre facture pour l'abonnement ${planName} est disponible.`,
  upgrade: (planName) =>
    `Votre facture pour l'upgrade vers ${planName} est disponible.`,
  renewal: (planName) =>
    `Votre facture pour le renouvellement de l'abonnement ${planName} est disponible.`,
};

// Extracted from the three near-identical inline blocks that used to sit
// in subscribeToPlan(), upgradeSubscription(), and renewSubscription().
// Re-fetches the payment (with plan + seller relations) itself rather
// than relying on whatever the caller already had loaded, which makes
// it safe to call from the BullMQ worker with just a paymentId.
//
// This also fixes a real bug that was in renewSubscription(): that call
// site was invoking `generateInvoiceDocument(payment.id)` — a single
// argument — where the function signature is `(type, paymentId)`. That
// meant `type` was actually the payment UUID, which matches neither
// "subscription" nor "order" inside resolvePaymentContext(), so the call
// always threw and was silently swallowed by the surrounding catch.
// Every renewal invoice has been failing silently until this fix.
//
// Errors here are re-thrown (not swallowed) on purpose: this function is
// only ever called from the BullMQ worker (jobs/invoiceDocuments.job.js),
// and letting the error propagate is what makes BullMQ mark the job as
// "failed" — which is what triggers its built-in retry (3 attempts,
// exponential backoff, configured in config/queue.js) and, if all
// retries are exhausted, the Sentry capture already wired up in
// config/worker.js. Swallowing the error here silently would mean a
// transient failure (Cloudinary hiccup, DB blip) never gets retried and
// never gets reported — exactly the gap we found via testInvoiceJobError.js.
async function sendSubscriptionInvoiceDocument(
  paymentId,
  kind = "subscription",
) {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { id: paymentId },
    include: {
      plan: true,
      subscription: {
        include: { sellerProfile: { include: { user: true } } },
      },
    },
  });
  if (!payment) {
    // Payment introuvable = erreur permanente (retry ne changera rien),
    // mais on throw quand même pour que ça remonte à Sentry après les
    // 3 tentatives BullMQ plutôt que de disparaître silencieusement.
    throw new Error(
      `sendSubscriptionInvoiceDocument: payment ${paymentId} introuvable.`,
    );
  }

  try {
    const { record: invoiceRecord, pdfBuffer: invoiceBuffer } =
      await generateInvoiceDocument("subscription", paymentId);

    const sellerProfile = payment.subscription.sellerProfile;
    const planName = payment.plan.name;

    const emailContent = subscriptionStatusEmail({
      name: sellerProfile.businessName,
      action: "invoiceIssued",
      planName,
      actionUrl: `${env.appUrl}/seller/subscription`,
      locale: "fr",
    });

    const buildBody =
      INVOICE_BODY_BY_KIND[kind] || INVOICE_BODY_BY_KIND.subscription;

    await createNotification({
      userId: sellerProfile.user.id,
      type: NOTIFICATION_TYPES.PAYMENT,
      title: emailContent.subject,
      body: buildBody(planName),
      data: {
        action: "invoiceIssued",
        subscriptionId: payment.subscriptionId,
        subscriptionPaymentId: payment.id,
      },
      emailOverride: {
        ...emailContent,
        attachments: invoiceBuffer
          ? [
              {
                filename: `${invoiceRecord.documentNumber}.pdf`,
                content: invoiceBuffer,
                contentType: "application/pdf",
              },
            ]
          : undefined,
      },
    });
  } catch (err) {
    console.error(
      `[subscription] Failed to generate/notify invoice (${kind}) for payment ${paymentId}:`,
      err.message,
    );
    throw err;
  }
}

// Extracted from confirmSubscriptionPayment()'s inline receipt block,
// unchanged aside from taking paymentId as a parameter and re-fetching
// what it needs, same reasoning as sendSubscriptionInvoiceDocument above.
// Same error-propagation reasoning too: both catches re-throw so BullMQ
// retry/Sentry actually engage instead of the failure being logged and
// forgotten.
async function sendSubscriptionReceiptDocument(paymentId) {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { id: paymentId },
    include: {
      plan: true,
      subscription: {
        include: { sellerProfile: { include: { user: true } } },
      },
    },
  });
  if (!payment) {
    throw new Error(
      `sendSubscriptionReceiptDocument: payment ${paymentId} introuvable.`,
    );
  }

  let receiptBuffer = null;
  let receiptRecord = null;
  try {
    const { record, pdfBuffer } = await generateReceiptDocument(
      "subscription",
      paymentId,
    );
    receiptRecord = record;
    receiptBuffer = pdfBuffer;
  } catch (err) {
    console.error(
      `[subscription] Failed to generate receipt for payment ${paymentId}:`,
      err.message,
    );
    throw err;
  }

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
      emailOverride: {
        ...emailContent,
        attachments:
          receiptBuffer && receiptRecord
            ? [
                {
                  filename: `${receiptRecord.documentNumber}.pdf`,
                  content: receiptBuffer,
                  contentType: "application/pdf",
                },
              ]
            : undefined,
      },
    });
  } catch (err) {
    console.error(
      `[subscription] Failed to notify payment-succeeded for payment ${paymentId}:`,
      err.message,
    );
    throw err;
  }
}

async function enqueueInvoiceJob(paymentId, kind, logLabel) {
  try {
    await createQueue(QUEUE_NAMES.INVOICES).add("subscription-invoice", {
      paymentId,
      kind,
    });
  } catch (err) {
    console.error(
      `[subscription] Failed to enqueue invoice job (${logLabel}):`,
      err.message,
    );
  }
}

async function enqueueReceiptJob(paymentId, logLabel) {
  try {
    await createQueue(QUEUE_NAMES.INVOICES).add("subscription-receipt", {
      paymentId,
    });
  } catch (err) {
    console.error(
      `[subscription] Failed to enqueue receipt job (${logLabel}):`,
      err.message,
    );
  }
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
          renewalPhoneNumber: payerPhoneNumber,
          renewalProvider: provider,
          renewalCountry: country,
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
          renewalPhoneNumber: payerPhoneNumber,
          renewalProvider: provider,
          renewalCountry: country,
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
      mobileMoneyProvider: provider,
      payerPhoneNumber,
      country,
      status: "PENDING",
      periodStart,
      periodEnd,
    },
  });

  // Was: inline `await generateInvoiceDocument(...)` + email, blocking
  // this request. Now: enqueue and return immediately — the worker calls
  // sendSubscriptionInvoiceDocument() (defined above) with the same logic.
  await enqueueInvoiceJob(
    payment.id,
    "subscription",
    `subscribeToPlan ${payment.id}`,
  );

  try {
    const deposit = await initiateDeposit({
      depositId: payment.id,
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

    try {
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { id: sellerProfileId },
        include: { user: true },
      });

      const emailContent = subscriptionStatusEmail({
        name: sellerProfile.businessName,
        action: "paymentFailed",
        planName: plan.name,
        actionUrl: `${env.appUrl}/seller/subscription`,
        locale: "fr",
      });

      await createNotification({
        userId: sellerProfile.user.id,
        type: NOTIFICATION_TYPES.PAYMENT,
        title: emailContent.subject,
        body: `Le paiement pour votre abonnement ${plan.name} a échoué. Merci de réessayer.`,
        data: {
          action: "subscriptionPaymentFailed",
          subscriptionId: subscription.id,
        },
        emailOverride: emailContent,
      });
    } catch (notifyErr) {
      console.error(
        "[subscription] Failed to notify initial deposit failure:",
        notifyErr.message,
      );
    }

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

  // An upgrade doesn't move `subscription.status` off ACTIVE while its
  // payment is in flight (only the initial subscription flow uses
  // PENDING_PAYMENT for that), so without this check a duplicate/double-tap
  // upgrade request would create a second, independent SubscriptionPayment
  // and could end up charging the seller twice for one intended upgrade.
  const pendingUpgradePayment = await prisma.subscriptionPayment.findFirst({
    where: { subscriptionId: subscription.id, status: "PENDING" },
  });
  if (pendingUpgradePayment) {
    throw new ConflictError(
      "Un paiement est déjà en attente pour cet abonnement. Attendez sa confirmation ou son échec avant de relancer un upgrade.",
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
      mobileMoneyProvider: provider,
      payerPhoneNumber,
      country,
      status: "PENDING",
      periodStart,
      periodEnd,
    },
  });

  // Same as subscribeToPlan: enqueue instead of generating/emailing inline.
  await enqueueInvoiceJob(
    payment.id,
    "upgrade",
    `upgradeSubscription ${payment.id}`,
  );

  try {
    const deposit = await initiateDeposit({
      depositId: payment.id,
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

    try {
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { id: sellerProfileId },
        include: { user: true },
      });

      const emailContent = subscriptionStatusEmail({
        name: sellerProfile.businessName,
        action: "paymentFailed",
        planName: newPlan.name,
        actionUrl: `${env.appUrl}/seller/subscription`,
        locale: "fr",
      });

      await createNotification({
        userId: sellerProfile.user.id,
        type: NOTIFICATION_TYPES.PAYMENT,
        title: emailContent.subject,
        body: `Le paiement pour l'upgrade vers ${newPlan.name} a échoué. Merci de réessayer.`,
        data: {
          action: "subscriptionPaymentFailed",
          subscriptionId: subscription.id,
        },
        emailOverride: emailContent,
      });
    } catch (notifyErr) {
      console.error(
        "[subscription] Failed to notify initial deposit failure (upgrade):",
        notifyErr.message,
      );
    }

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

  // Atomic claim — guards against a duplicate/concurrent webhook delivery
  // (PawaPay's own retry policy can resend the same callback) both passing
  // the in-memory check above and both applying the plan change / sending
  // a duplicate receipt.
  const claimed = await prisma.subscriptionPayment.updateMany({
    where: { id: payment.id, status: { not: "SUCCEEDED" } },
    data: { status: "SUCCEEDED", paidAt: new Date() },
  });
  if (claimed.count !== 1) {
    return { payment, subscription: payment.subscription }; // lost the race
  }

  const updatedPayment = await prisma.subscriptionPayment.findUnique({
    where: { id: payment.id },
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
      renewalPhoneNumber: payment.payerPhoneNumber,
      renewalProvider: payment.mobileMoneyProvider,
      renewalCountry: payment.country,
    },
  });

  // Was: inline `await generateReceiptDocument(...)` + email, blocking
  // this webhook handler's response. Now: enqueue and return immediately.
  await enqueueReceiptJob(
    updatedPayment.id,
    `confirmSubscriptionPayment ${updatedPayment.id}`,
  );

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

  const claimed = await prisma.subscriptionPayment.updateMany({
    where: { id: payment.id, status: { not: "FAILED" } },
    data: { status: "FAILED", failureReason },
  });
  if (claimed.count !== 1) {
    return { payment, subscription: payment.subscription }; // lost the race
  }

  const updatedPayment = await prisma.subscriptionPayment.findUnique({
    where: { id: payment.id },
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
      include: {
        plan: { select: { name: true, slug: true } },
        invoices: {
          select: { type: true, documentNumber: true, pdfUrl: true },
        },
      },
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
          invoices: {
            select: { type: true, documentNumber: true, pdfUrl: true },
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

async function findSubscriptionsDueForRenewal() {
  const cutoff = new Date();
  cutoff.setDate(
    cutoff.getDate() + SUBSCRIPTION_CONFIG.RENEWAL_ATTEMPT_DAYS_BEFORE_EXPIRY,
  );

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "PAST_DUE"] },
      autoRenew: true,
      currentPeriodEnd: { lte: cutoff },
      OR: [
        { lastRenewalAttemptAt: null },
        { lastRenewalAttemptAt: { lt: startOfToday } },
      ],
    },
    include: {
      plan: { include: { prices: true } },
      sellerProfile: { include: { user: true } },
    },
  });
}

async function renewSubscription(subscription) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const claimed = await prisma.subscription.updateMany({
    where: {
      id: subscription.id,
      OR: [
        { lastRenewalAttemptAt: null },
        { lastRenewalAttemptAt: { lt: startOfToday } },
      ],
    },
    data: { lastRenewalAttemptAt: new Date() },
  });
  if (claimed.count !== 1) {
    console.warn(
      `[renewal] Subscription ${subscription.id} already claimed for renewal today — skipping.`,
    );
    return;
  }

  if (
    !subscription.renewalPhoneNumber ||
    !subscription.renewalProvider ||
    !subscription.renewalCountry
  ) {
    console.error(
      `[renewal] Subscription ${subscription.id} missing renewal payment info — skipping, marking PAST_DUE.`,
    );
    await markPastDue(subscription);
    return;
  }

  let price;
  try {
    price = resolvePlanPrice(
      subscription.plan,
      subscription.billingCycle,
      subscription.currency,
    );
  } catch (err) {
    // Previously this threw before any FAILED/PAST_DUE state was recorded,
    // so the subscription stayed ACTIVE past its paid period and the cron
    // silently re-failed on it every day thereafter (see audit finding).
    console.error(
      `[renewal] No price found for subscription ${subscription.id} (plan/cycle/currency changed?):`,
      err.message,
    );
    await markPastDue(subscription);
    return;
  }

  const periodStart = new Date(subscription.currentPeriodEnd);
  const periodEnd = calculatePeriodEnd(periodStart, subscription.billingCycle);

  const payment = await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      planId: subscription.planId,
      billingCycle: subscription.billingCycle,
      currency: subscription.currency,
      amount: price.amount,
      mobileMoneyProvider: subscription.renewalProvider,
      payerPhoneNumber: subscription.renewalPhoneNumber,
      country: subscription.renewalCountry,
      status: "PENDING",
      periodStart,
      periodEnd,
    },
  });

  // Was the buggy `generateInvoiceDocument(payment.id)` single-argument
  // call (see the comment on sendSubscriptionInvoiceDocument above) —
  // now enqueues correctly with kind "renewal", same as the other two
  // call sites.
  await enqueueInvoiceJob(
    payment.id,
    "renewal",
    `renewSubscription ${payment.id}`,
  );

  try {
    const deposit = await initiateDeposit({
      depositId: payment.id,
      amount: price.amount,
      currency: subscription.currency,
      country: subscription.renewalCountry,
      provider: subscription.renewalProvider,
      payerPhoneNumber: subscription.renewalPhoneNumber,
      customerMessage: `Renouv ${subscription.plan.name}`.slice(0, 22),
      clientReferenceId: payment.id,
      metadata: {
        type: "SUBSCRIPTION",
        subscriptionId: subscription.id,
        subscriptionPaymentId: payment.id,
        sellerProfileId: subscription.sellerProfileId,
        isRenewal: "true",
      },
    });

    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { depositId: deposit.depositId },
    });
  } catch (err) {
    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: err.message },
    });
    await markPastDue(subscription);
  }
}

async function markPastDue(subscription) {
  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "PAST_DUE" },
  });

  try {
    const emailContent = subscriptionStatusEmail({
      name: subscription.sellerProfile.businessName,
      action: "renewalFailed",
      planName: subscription.plan.name,
      graceDays: SUBSCRIPTION_CONFIG.PAST_DUE_GRACE_PERIOD_DAYS,
      actionUrl: `${env.appUrl}/seller/subscription`,
      locale: "fr",
    });

    await createNotification({
      userId: subscription.sellerProfile.user.id,
      type: NOTIFICATION_TYPES.PAYMENT,
      title: emailContent.subject,
      body: `Le renouvellement de votre abonnement ${subscription.plan.name} a échoué. Vous avez ${SUBSCRIPTION_CONFIG.PAST_DUE_GRACE_PERIOD_DAYS} jours pour régulariser.`,
      data: {
        action: "subscriptionRenewalFailed",
        subscriptionId: subscription.id,
      },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[renewal] Failed to notify renewal-failed:", err.message);
  }

  return updated;
}

async function expireOverdueSubscriptions() {
  const graceThreshold = new Date();
  graceThreshold.setDate(
    graceThreshold.getDate() - SUBSCRIPTION_CONFIG.PAST_DUE_GRACE_PERIOD_DAYS,
  );

  const overdue = await prisma.subscription.findMany({
    where: {
      status: "PAST_DUE",
      currentPeriodEnd: { lte: graceThreshold },
    },
    include: { plan: true, sellerProfile: { include: { user: true } } },
  });

  for (const subscription of overdue) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "EXPIRED" },
    });

    try {
      const emailContent = subscriptionStatusEmail({
        name: subscription.sellerProfile.businessName,
        action: "expired",
        planName: subscription.plan.name,
        actionUrl: `${env.appUrl}/seller/subscription`,
        locale: "fr",
      });

      await createNotification({
        userId: subscription.sellerProfile.user.id,
        type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
        title: emailContent.subject,
        body: `Votre abonnement ${subscription.plan.name} a expiré.`,
        data: {
          action: "subscriptionExpired",
          subscriptionId: subscription.id,
        },
        emailOverride: emailContent,
      });
    } catch (err) {
      console.error("[renewal] Failed to notify expiration:", err.message);
    }
  }

  return overdue.length;
}

async function runRenewalCycle() {
  const dueSubscriptions = await findSubscriptionsDueForRenewal();
  console.log(
    `[renewal] ${dueSubscriptions.length} subscription(s) à renouveler.`,
  );
  for (const subscription of dueSubscriptions) {
    try {
      await renewSubscription(subscription);
    } catch (err) {
      console.error(
        `[renewal] Error renewing subscription ${subscription.id}:`,
        err.message,
      );
    }
  }

  const expiredCount = await expireOverdueSubscriptions();
  console.log(`[renewal] ${expiredCount} subscription(s) expirée(s).`);
}

async function getSubscriptionRevenue() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [allTime, thisMonth, last30, pending] = await Promise.all([
    prisma.subscriptionPayment.groupBy({
      by: ["currency"],
      where: { status: "SUCCEEDED" },
      _sum: { amount: true },
      _count: { _all: true },
    }),

    prisma.subscriptionPayment.groupBy({
      by: ["currency"],
      where: { status: "SUCCEEDED", paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: { _all: true },
    }),

    prisma.subscriptionPayment.groupBy({
      by: ["currency"],
      where: { status: "SUCCEEDED", paidAt: { gte: last30Days } },
      _sum: { amount: true },
      _count: { _all: true },
    }),

    prisma.subscriptionPayment.groupBy({
      by: ["currency"],
      where: { status: { in: ["PENDING", "FAILED"] } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const mapByCurrency = (rows) =>
    rows.map((row) => ({
      currency: row.currency,
      total: row._sum.amount,
      paymentCount: row._count._all,
    }));

  return {
    allTimeCollected: mapByCurrency(allTime),
    thisMonthCollected: mapByCurrency(thisMonth),
    last30DaysCollected: mapByCurrency(last30),
    pendingOrFailed: mapByCurrency(pending),
    note: "allTimeCollected représente l'argent réellement encaissé (SUCCEEDED). C'est ce montant, par devise, que tu peux demander en settlement PawaPay — cet argent appartient entièrement à SwiftGoma, contrairement aux futurs paiements liés au wallet/commandes vendeurs.",
  };
}

async function assertPaymentOwnedBySeller(depositId, sellerProfileId) {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { depositId },
    include: { subscription: { select: { sellerProfileId: true } } },
  });
  if (!payment) {
    throw new NotFoundError(
      "Aucun paiement de subscription trouvé pour ce depositId.",
    );
  }
  if (payment.subscription.sellerProfileId !== sellerProfileId) {
    throw new NotFoundError(
      "Aucun paiement de subscription trouvé pour ce depositId.",
    );
  }
  return payment;
}

module.exports = {
  subscribeToPlan,
  upgradeSubscription,
  getSubscriptionRevenue,
  confirmSubscriptionPayment,
  failSubscriptionPayment,
  getSubscriptionBySellerId,
  listPaymentHistory,
  cancelSubscription,
  reactivateCanceledSubscription,
  assertPaymentOwnedBySeller,
  getSubscriptionStats,
  runRenewalCycle,
  sendSubscriptionInvoiceDocument,
  sendSubscriptionReceiptDocument,
};
