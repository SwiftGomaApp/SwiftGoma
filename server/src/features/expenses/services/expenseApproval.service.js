const crypto = require("crypto");
const { getRedisClient } = require("../../../config/redis");
const { env } = require("../../../config/env");
const {
  sendAdminExpenseOtpEmail,
  sendAdminPayoutInitiatedEmail,
} = require("../../../common/emails");
const { generateAuthOtp, safeCompareCode } = require("../../auth/utils/auth");
const {
  ValidationError,
  UnauthorizedError,
  AppError,
} = require("../../../common/errors");
const { initiatePayout } = require("../../payments/services/pawapay.service");
const { buildMetadata } = require("../../payments/utils/pawapay.utils");
const {
  recordAdminPayout,
  updateAdminPayout,
  mapPayoutInput,
} = require("../../payments/services/adminPayout.service");
const { assertValidPawaPayPayoutInput } = require("../../payments/services/adminPayoutApproval.service");
const {
  applyAdminPayoutFailed,
  notifyExpensePayoutOutcome,
} = require("../../payments/services/adminPayoutStatus.service");
const {
  getExpenseRecordForApproval,
  buildPayoutInputFromExpense,
  markExpenseProcessing,
  markExpenseFailed,
  getExpenseById,
  resetFailedExpenseForApproval,
} = require("./expense.service");
const { getPrismaClient } = require("../../../config/prisma");

const APPROVAL_TTL_MINUTES = 5;
const memoryStore = new Map();
const memoryTimeouts = new Map();

function storeKey(adminId) {
  return `expense-approval:${adminId}`;
}

function isPendingExpired(pending) {
  if (!pending?.expiresAt) return true;
  return new Date(pending.expiresAt).getTime() <= Date.now();
}

async function savePending(adminId, data) {
  const key = storeKey(adminId);
  const serialized = JSON.stringify(data);
  const redis = getRedisClient();
  if (redis) {
    await redis.setex(key, APPROVAL_TTL_MINUTES * 60, serialized);
    return;
  }

  const existingTimeout = memoryTimeouts.get(key);
  if (existingTimeout) clearTimeout(existingTimeout);

  memoryStore.set(key, data);
  const timeout = setTimeout(() => {
    memoryStore.delete(key);
    memoryTimeouts.delete(key);
  }, APPROVAL_TTL_MINUTES * 60 * 1000);
  memoryTimeouts.set(key, timeout);
}

async function loadPending(adminId) {
  const key = storeKey(adminId);
  const redis = getRedisClient();
  if (redis) {
    const raw = await redis.get(key);
    if (!raw) return null;
    const pending = JSON.parse(raw);
    if (isPendingExpired(pending)) {
      await clearPending(adminId);
      return null;
    }
    return pending;
  }

  const pending = memoryStore.get(key) || null;
  if (!pending) return null;
  if (isPendingExpired(pending)) {
    await clearPending(adminId);
    return null;
  }
  return pending;
}

async function clearPending(adminId) {
  const key = storeKey(adminId);
  const redis = getRedisClient();
  if (redis) {
    await redis.del(key);
    return;
  }
  const existingTimeout = memoryTimeouts.get(key);
  if (existingTimeout) clearTimeout(existingTimeout);
  memoryTimeouts.delete(key);
  memoryStore.delete(key);
}

async function getAdminPrimaryEmail(adminId) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      name: true,
      role: true,
      emails: {
        select: { email: true, isPrimary: true, isVerified: true },
        orderBy: [{ isPrimary: "desc" }, { isVerified: "desc" }],
      },
    },
  });
  if (!user || user.role !== "ADMIN") {
    throw new UnauthorizedError("Accès administrateur requis.");
  }

  const primary = user.emails.find((entry) => entry.isPrimary);
  const verified = user.emails.find((entry) => entry.isVerified);
  const email = primary?.email || verified?.email || user.emails[0]?.email;
  if (!email) {
    throw new ValidationError(
      "Votre compte administrateur n'a pas d'adresse e-mail.",
    );
  }
  return { email, name: user.name };
}

function getAdminDashboardUrl() {
  const adminOrigin = env.clientOrigins.find((origin) =>
    /admin|3001|5174/i.test(origin),
  );
  return adminOrigin || env.clientOrigins[0] || null;
}

function assertPendingSession(pending, { pendingId, expenseId, code }) {
  if (!pending) {
    throw new UnauthorizedError(
      "Aucune approbation en attente. Demandez un nouveau code.",
    );
  }
  if (pending.pendingId !== pendingId) {
    throw new UnauthorizedError("Session d'approbation invalide.");
  }
  if (pending.expenseId !== expenseId) {
    throw new UnauthorizedError("La dépense ne correspond pas à la session.");
  }
  if (isPendingExpired(pending)) {
    throw new UnauthorizedError("Code expiré. Demandez une nouvelle approbation.");
  }
  if (!safeCompareCode(pending.code, code)) {
    throw new UnauthorizedError("Code de vérification invalide.");
  }
}

async function requestExpenseApproval(adminId, expenseId) {
  const expense = await getExpenseRecordForApproval(expenseId);
  if (expense.status === "FAILED") {
    await resetFailedExpenseForApproval(expenseId);
  }

  const payoutInput = buildPayoutInputFromExpense(expense);
  assertValidPawaPayPayoutInput(payoutInput);

  const { email, name } = await getAdminPrimaryEmail(adminId);
  const code = generateAuthOtp();
  const pendingId = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + APPROVAL_TTL_MINUTES * 60 * 1000,
  ).toISOString();

  await savePending(adminId, {
    pendingId,
    code,
    expiresAt,
    expenseId,
    payout: payoutInput,
  });

  try {
    await sendAdminExpenseOtpEmail(email, {
      name,
      code,
      expenseTitle: expense.title,
      expenseReference: expense.reference,
      amount: payoutInput.amount,
      currency: payoutInput.currency,
      vendorName: expense.vendorName,
      expiresInMinutes: APPROVAL_TTL_MINUTES,
      locale: "fr",
    });
  } catch (err) {
    await clearPending(adminId);
    console.error("[expense-approval] OTP email failed:", err.message);
    throw new AppError(
      "Impossible d'envoyer l'e-mail de vérification. Vérifiez la configuration SMTP.",
      502,
      "EXPENSE_OTP_EMAIL_FAILED",
    );
  }

  return {
    pendingId,
    message: `Un code de vérification a été envoyé à ${email}.`,
    expiresInMinutes: APPROVAL_TTL_MINUTES,
    summary: {
      expenseId: expense.id,
      reference: expense.reference,
      title: expense.title,
      amount: payoutInput.amount,
      currency: payoutInput.currency,
      vendorName: expense.vendorName,
    },
  };
}

async function resendExpenseApproval(adminId, expenseId, { pendingId } = {}) {
  const pending = await loadPending(adminId);
  if (pending) {
    if (pending.expenseId !== expenseId) {
      throw new UnauthorizedError("La dépense ne correspond pas à la session.");
    }
    if (pendingId && pending.pendingId !== pendingId) {
      throw new UnauthorizedError(
        "Session d'approbation expirée. Relancez l'approbation depuis le début.",
      );
    }
  }

  return requestExpenseApproval(adminId, expenseId);
}

async function confirmExpenseApproval(adminId, expenseId, { pendingId, code }) {
  if (!pendingId || !code) {
    throw new ValidationError("Identifiant de session et code requis.");
  }

  const pending = await loadPending(adminId);
  try {
    assertPendingSession(pending, { pendingId, expenseId, code });
  } catch (err) {
    if (pending && isPendingExpired(pending)) {
      await clearPending(adminId);
    }
    throw err;
  }

  await clearPending(adminId);
  await getExpenseRecordForApproval(expenseId);

  let payoutRecord = await recordAdminPayout({
    adminId,
    provider: "pawapay",
    payoutInput: pending.payout,
    status: "PROCESSING",
  });

  let result;
  try {
    result = await initiatePayout({
      ...pending.payout,
      payoutId: payoutRecord.id,
      metadata: buildMetadata({
        type: "EXPENSE_PAYOUT",
        expenseId,
        adminPayoutId: payoutRecord.id,
      }),
    });
  } catch (err) {
    payoutRecord = await updateAdminPayout(payoutRecord.id, {
      status: "FAILED",
      externalId: payoutRecord.id,
      failureReason: err.message,
    });
    await markExpenseFailed(expenseId, err.message);
    try {
      const expense = await getExpenseById(expenseId);
      await notifyExpensePayoutOutcome(expense, "FAILED", {
        failureReason: err.message,
        source: "initiation",
      });
    } catch (notifyErr) {
      console.error(
        "[expense-approval] Failed to notify payout initiation failure:",
        notifyErr.message,
      );
    }
    throw err;
  }

  const externalStatus = result?.status || result?.data?.status || null;
  payoutRecord = await updateAdminPayout(payoutRecord.id, {
    externalId: result?.payoutId || payoutRecord.id,
    externalStatus,
    providerResponse: result,
  });

  if (externalStatus === "FAILED") {
    await applyAdminPayoutFailed(
      payoutRecord.externalId,
      "PawaPay payout rejected.",
      {
        externalStatus,
        providerResponse: result,
        source: "initiation",
      },
    );
    throw new AppError(
      "Le paiement PawaPay a été rejeté immédiatement.",
      502,
      "EXPENSE_PAYOUT_REJECTED",
    );
  }

  await markExpenseProcessing(adminId, expenseId, payoutRecord.id);

  try {
    const { email, name } = await getAdminPrimaryEmail(adminId);
    const mapped = mapPayoutInput("pawapay", pending.payout);
    await sendAdminPayoutInitiatedEmail(email, {
      name,
      amount: mapped.amount,
      currency: mapped.currency,
      beneficiary: mapped.beneficiary,
      phoneNumber: mapped.phoneNumber,
      providerName: mapped.providerName,
      providerLabel: "PawaPay (dépense)",
      externalId: result?.payoutId || payoutRecord.id,
      externalStatus: externalStatus,
      adminUrl: getAdminDashboardUrl(),
      locale: "fr",
    });
  } catch (err) {
    console.error("[expense-approval] confirmation email failed:", err.message);
  }

  return {
    ...result,
    expense: await getExpenseById(expenseId),
    adminPayout: payoutRecord,
  };
}

module.exports = {
  requestExpenseApproval,
  resendExpenseApproval,
  confirmExpenseApproval,
};
