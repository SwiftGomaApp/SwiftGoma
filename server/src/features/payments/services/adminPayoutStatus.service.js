const { getPrismaClient } = require("../../../config/prisma");
const { checkPayoutStatus } = require("./pawapay.service");
const {
  invalidateAdminTransactionsCache,
} = require("./adminPayout.service");
const { createNotification } = require("../../notification/services/notification.service");
const { NOTIFICATION_TYPES } = require("../../notification/config/notificationTypes");

const prisma = getPrismaClient();

const PAYOUT_SUCCESS_STATUSES = ["COMPLETED"];
const PAYOUT_FAILURE_STATUSES = ["FAILED"];
const RECONCILE_AFTER_MINUTES = 5;

function extractFailureReason(providerResponse = {}) {
  const reason = providerResponse.failureReason;
  if (!reason) return null;
  if (typeof reason === "string") return reason;
  return reason.failureMessage || reason.message || null;
}

function extractPayoutStatus(providerResponse = {}) {
  if (providerResponse.data?.status) return providerResponse.data.status;
  if (
    providerResponse.status &&
    !["FOUND", "NOT_FOUND"].includes(providerResponse.status)
  ) {
    return providerResponse.status;
  }
  return null;
}

async function notifyExpensePayoutOutcome(expense, outcome, details = {}) {
  const { failureReason, source } = details;
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isBlocked: false, deletedAt: null },
    select: { id: true },
  });

  const recipientIds = new Set(admins.map((admin) => admin.id));
  if (expense.createdById) {
    recipientIds.add(expense.createdById);
  }

  const isCompleted = outcome === "COMPLETED";
  const title = isCompleted
    ? "Dépense payée avec succès"
    : "Échec du paiement de la dépense";
  const body = isCompleted
    ? `La dépense ${expense.reference} « ${expense.title} » (${expense.amount} ${expense.currency}) a été payée via PawaPay.`
    : `Le paiement PawaPay de la dépense ${expense.reference} « ${expense.title} » a échoué${failureReason ? ` : ${failureReason}` : "."}${source === "reconciliation" ? " (statut réconcilié automatiquement)" : ""}`;

  await Promise.all(
    [...recipientIds].map((userId) =>
      createNotification({
        userId,
        type: NOTIFICATION_TYPES.PAYMENT,
        title,
        body,
        data: {
          action: isCompleted ? "expensePayoutCompleted" : "expensePayoutFailed",
          expenseId: expense.id,
          reference: expense.reference,
          href: "/expenses",
        },
      }),
    ),
  );
}

async function notifyStandaloneAdminPayoutOutcome(payout, outcome, details = {}) {
  const { failureReason } = details;
  const isCompleted = outcome === "COMPLETED";
  const title = isCompleted
    ? "Paiement sortant confirmé"
    : "Échec du paiement sortant";
  const body = isCompleted
    ? `Le paiement PawaPay de ${payout.amount} ${payout.currency} vers ${payout.beneficiary || payout.phoneNumber} a été confirmé.`
    : `Le paiement PawaPay de ${payout.amount} ${payout.currency} vers ${payout.beneficiary || payout.phoneNumber} a échoué${failureReason ? ` : ${failureReason}` : "."}`;

  await createNotification({
    userId: payout.adminId,
    type: NOTIFICATION_TYPES.PAYMENT,
    title,
    body,
    data: {
      action: isCompleted ? "adminPayoutCompleted" : "adminPayoutFailed",
      adminPayoutId: payout.id,
    },
  });
}

async function applyAdminPayoutCompleted(
  externalId,
  { externalStatus, providerResponse, source = "callback" } = {},
) {
  const payout = await prisma.adminPayout.findFirst({
    where: { externalId, status: "PROCESSING" },
    include: {
      expense: true,
    },
  });
  if (!payout) return null;

  const updated = await prisma.adminPayout.updateMany({
    where: { id: payout.id, status: "PROCESSING" },
    data: {
      status: "COMPLETED",
      externalStatus: externalStatus || extractPayoutStatus(providerResponse),
      providerResponse: providerResponse || undefined,
      failureReason: null,
    },
  });
  if (updated.count === 0) return null;

  await invalidateAdminTransactionsCache();

  if (payout.expense) {
    await prisma.expense.updateMany({
      where: { id: payout.expense.id, status: "PROCESSING" },
      data: { status: "COMPLETED" },
    });

    try {
      await notifyExpensePayoutOutcome(payout.expense, "COMPLETED", { source });
    } catch (err) {
      console.error(
        "[admin-payout] Failed to notify expense payout completion:",
        err.message,
      );
    }
  } else {
    try {
      await notifyStandaloneAdminPayoutOutcome(payout, "COMPLETED", { source });
    } catch (err) {
      console.error(
        "[admin-payout] Failed to notify admin payout completion:",
        err.message,
      );
    }
  }

  return payout;
}

async function applyAdminPayoutFailed(
  externalId,
  failureReason,
  { externalStatus, providerResponse, source = "callback" } = {},
) {
  const payout = await prisma.adminPayout.findFirst({
    where: { externalId, status: "PROCESSING" },
    include: {
      expense: true,
    },
  });
  if (!payout) return null;

  const reason =
    failureReason ||
    extractFailureReason(providerResponse) ||
    "Échec du paiement sortant.";

  const updated = await prisma.adminPayout.updateMany({
    where: { id: payout.id, status: "PROCESSING" },
    data: {
      status: "FAILED",
      externalStatus: externalStatus || extractPayoutStatus(providerResponse),
      providerResponse: providerResponse || undefined,
      failureReason: reason,
    },
  });
  if (updated.count === 0) return null;

  await invalidateAdminTransactionsCache();

  if (payout.expense) {
    await prisma.expense.updateMany({
      where: {
        id: payout.expense.id,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      data: {
        status: "FAILED",
        rejectionReason: reason,
      },
    });

    try {
      await notifyExpensePayoutOutcome(payout.expense, "FAILED", {
        failureReason: reason,
        source,
      });
    } catch (err) {
      console.error(
        "[admin-payout] Failed to notify expense payout failure:",
        err.message,
      );
    }
  } else {
    try {
      await notifyStandaloneAdminPayoutOutcome(payout, "FAILED", {
        failureReason: reason,
        source,
      });
    } catch (err) {
      console.error(
        "[admin-payout] Failed to notify admin payout failure:",
        err.message,
      );
    }
  }

  return payout;
}

async function handlePawaPayPayoutCallback(body = {}) {
  const payoutId = body.payoutId;
  const status = body.status;

  if (!payoutId || !status) {
    console.warn("[admin-payout] PawaPay payout callback missing payoutId or status.");
    return null;
  }

  if (PAYOUT_SUCCESS_STATUSES.includes(status)) {
    return applyAdminPayoutCompleted(payoutId, {
      externalStatus: status,
      providerResponse: body,
      source: "callback",
    });
  }

  if (PAYOUT_FAILURE_STATUSES.includes(status)) {
    const failureReason =
      extractFailureReason(body) || `PawaPay payout ${status}`;
    return applyAdminPayoutFailed(payoutId, failureReason, {
      externalStatus: status,
      providerResponse: body,
      source: "callback",
    });
  }

  return null;
}

async function reconcileOneProcessingAdminPayout(payout) {
  if (!payout.externalId) return null;

  let response;
  try {
    response = await checkPayoutStatus(payout.externalId);
  } catch (err) {
    console.error(
      `[admin-payout] Reconciliation status check failed for ${payout.id} (${payout.externalId}):`,
      err.message,
    );
    return null;
  }

  const status = extractPayoutStatus(response);
  if (!status) return null;

  if (PAYOUT_SUCCESS_STATUSES.includes(status)) {
    return applyAdminPayoutCompleted(payout.externalId, {
      externalStatus: status,
      providerResponse: response,
      source: "reconciliation",
    });
  }

  if (PAYOUT_FAILURE_STATUSES.includes(status)) {
    const failureReason =
      extractFailureReason(response?.data || response) ||
      `PawaPay payout ${status} (reconciled via status poll)`;
    return applyAdminPayoutFailed(payout.externalId, failureReason, {
      externalStatus: status,
      providerResponse: response,
      source: "reconciliation",
    });
  }

  return null;
}

async function reconcileProcessingAdminPayouts() {
  const threshold = new Date(
    Date.now() - RECONCILE_AFTER_MINUTES * 60 * 1000,
  );

  const stalePayouts = await prisma.adminPayout.findMany({
    where: {
      status: "PROCESSING",
      provider: "PAWAPAY",
      externalId: { not: null },
      createdAt: { lte: threshold },
    },
  });

  const results = await Promise.allSettled(
    stalePayouts.map((payout) => reconcileOneProcessingAdminPayout(payout)),
  );

  return results.filter((result) => result.status === "fulfilled" && result.value)
    .length;
}

module.exports = {
  applyAdminPayoutCompleted,
  applyAdminPayoutFailed,
  handlePawaPayPayoutCallback,
  reconcileProcessingAdminPayouts,
  notifyExpensePayoutOutcome,
};
