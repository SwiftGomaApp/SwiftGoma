const crypto = require("crypto");
const { getPrismaClient } = require("../../../config/prisma");
const { getRedisClient } = require("../../../config/redis");
const { env } = require("../../../config/env");
const {
  sendAdminPayoutOtpEmail,
  sendAdminPayoutInitiatedEmail,
} = require("../../../common/emails");
const {
  generateAuthOtp,
  hashVerificationCode,
  verifyHashedCode,
} = require("../../auth/utils/auth");
const {
  ValidationError,
  UnauthorizedError,
  AppError,
} = require("../../../common/errors");
const {
  initiatePayout: initiateMbiyoPayPayout,
} = require("./mbioyopay.service");
const {
  initiatePayout: initiatePawaPayPayout,
  initiateRefund: initiatePawaPayRefund,
} = require("./pawapay.service");
const {
  recordAdminPayout,
  updateAdminPayout,
  mapPayoutInput,
  extractExternalMeta,
} = require("./adminPayout.service");
const { assertValidPayoutInput } = require("../utils/mbiyopay.utils");
const {
  isValidAmount,
  isValidMsisdn,
  isValidStatementDescription,
} = require("../utils/pawapay.utils");
const {
  assertOtpNotLocked,
  assertOtpResendCooldown,
  markOtpSent,
  handleInvalidOtpAttempt,
  clearOtpAttempts,
  assertAdminDailyPayoutLimits,
  withPayoutConfirmLock,
  adminPayoutOtpScope,
  adminRefundOtpScope,
} = require("../utils/payoutSecurity");

const PAYOUT_OTP_TTL_MINUTES = 5;
const memoryStore = new Map();

function storeKey(provider, adminId, kind = "payout") {
  return `${provider}-${kind}-approval:${adminId}`;
}

async function savePendingApproval(provider, adminId, data, kind = "payout") {
  const key = storeKey(provider, adminId, kind);
  const serialized = JSON.stringify(data);
  const redis = getRedisClient();
  if (redis) {
    await redis.setex(key, PAYOUT_OTP_TTL_MINUTES * 60, serialized);
    return;
  }
  memoryStore.set(key, data);
  setTimeout(() => memoryStore.delete(key), PAYOUT_OTP_TTL_MINUTES * 60 * 1000);
}

async function loadPendingApproval(provider, adminId, kind = "payout") {
  const key = storeKey(provider, adminId, kind);
  const redis = getRedisClient();
  if (redis) {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  }
  return memoryStore.get(key) || null;
}

async function clearPendingApproval(provider, adminId, kind = "payout") {
  const key = storeKey(provider, adminId, kind);
  const redis = getRedisClient();
  if (redis) {
    await redis.del(key);
    return;
  }
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
      "Votre compte administrateur n'a pas d'adresse e-mail — l'approbation de paiement en nécessite une.",
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

function assertValidPawaPayPayoutInput(input) {
  if (!isValidAmount(input.amount)) {
    throw new ValidationError("Montant de paiement sortant invalide.");
  }
  if (!input.currency || !input.country || !input.provider) {
    throw new ValidationError("Devise, pays et fournisseur sont requis.");
  }
  if (!isValidMsisdn(input.recipientPhoneNumber)) {
    throw new ValidationError("Numéro de téléphone du destinataire invalide.");
  }
  if (!isValidStatementDescription(input.customerMessage)) {
    throw new ValidationError(
      "Le message client doit contenir entre 4 et 22 caractères alphanumériques.",
    );
  }
}

function assertValidPawaPayRefundInput(input) {
  if (!input.depositId) {
    throw new ValidationError(
      "L'identifiant de dépôt est requis pour un remboursement.",
    );
  }
  if (input.amount !== undefined && !isValidAmount(input.amount)) {
    throw new ValidationError("Montant de remboursement invalide.");
  }
}

async function requestPayoutApproval(
  provider,
  adminId,
  payoutInput,
  { validate, providerLabel, beneficiaryLabel, buildSummary, kind = "payout" },
) {
  validate(payoutInput);

  const otpScope =
    kind === "refund"
      ? adminRefundOtpScope(provider, adminId)
      : adminPayoutOtpScope(provider, adminId);
  await assertOtpResendCooldown(otpScope);

  const { email, name } = await getAdminPrimaryEmail(adminId);
  const code = generateAuthOtp();
  const codeHash = hashVerificationCode(code);
  const pendingId = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + PAYOUT_OTP_TTL_MINUTES * 60 * 1000,
  ).toISOString();

  await savePendingApproval(
    provider,
    adminId,
    {
      pendingId,
      codeHash,
      expiresAt,
      provider,
      kind,
      payout: payoutInput,
    },
    kind,
  );

  try {
    await sendAdminPayoutOtpEmail(email, {
      name,
      code,
      amount: payoutInput.amount,
      currency: payoutInput.currency,
      beneficiary: beneficiaryLabel(payoutInput),
      providerLabel,
      expiresInMinutes: PAYOUT_OTP_TTL_MINUTES,
      locale: "fr",
    });
  } catch (err) {
    await clearPendingApproval(provider, adminId, kind);
    console.error("[admin-payout] OTP email failed:", err.message);
    throw new AppError(
      "Impossible d'envoyer l'e-mail de vérification de paiement. Vérifiez la configuration SMTP.",
      502,
      "PAYOUT_OTP_EMAIL_FAILED",
    );
  }

  await markOtpSent(otpScope);

  return {
    pendingId,
    message: `Un code de vérification a été envoyé à ${email}. Saisissez-le pour approuver ce paiement.`,
    expiresInMinutes: PAYOUT_OTP_TTL_MINUTES,
    summary: buildSummary(payoutInput),
  };
}

async function sendPayoutInitiatedEmail(
  adminId,
  provider,
  providerLabel,
  payoutInput,
  result,
) {
  try {
    const { email, name } = await getAdminPrimaryEmail(adminId);
    const mapped = mapPayoutInput(provider, payoutInput);

    await sendAdminPayoutInitiatedEmail(email, {
      name,
      amount: mapped.amount,
      currency: mapped.currency,
      beneficiary: mapped.beneficiary,
      phoneNumber: mapped.phoneNumber,
      network: mapped.network,
      providerName: mapped.providerName,
      providerLabel,
      externalId: result?.payoutId || result?.orderId || null,
      externalStatus: result?.status || null,
      adminUrl: getAdminDashboardUrl(),
      locale: "fr",
    });
  } catch (err) {
    console.error("[admin-payout] confirmation email failed:", err.message);
  }
}

async function confirmPayoutApproval(
  provider,
  adminId,
  { pendingId, code },
  execute,
  providerLabel,
  kind = "payout",
) {
  return withPayoutConfirmLock(adminId, async () => {
    if (!pendingId || !code) {
      throw new ValidationError(
        "Identifiant de session et code de vérification requis.",
      );
    }

    const otpScope =
      kind === "refund"
        ? adminRefundOtpScope(provider, adminId)
        : adminPayoutOtpScope(provider, adminId);
    await assertOtpNotLocked(otpScope);

    const pending = await loadPendingApproval(provider, adminId, kind);
    if (!pending) {
      throw new UnauthorizedError(
        "Aucune approbation de paiement en attente. Demandez un nouveau code.",
      );
    }
    if (pending.pendingId !== pendingId) {
      throw new UnauthorizedError(
        "Session d'approbation de paiement invalide.",
      );
    }
    if (pending.provider !== provider) {
      throw new UnauthorizedError("Fournisseur de paiement incompatible.");
    }
    if (pending.kind && pending.kind !== kind) {
      throw new UnauthorizedError(
        "Type d'approbation de paiement incompatible.",
      );
    }
    if (new Date(pending.expiresAt).getTime() < Date.now()) {
      await clearPendingApproval(provider, adminId, kind);
      throw new UnauthorizedError(
        "Code de vérification expiré. Demandez une nouvelle approbation de paiement.",
      );
    }
    if (!verifyHashedCode(pending.codeHash, code)) {
      await handleInvalidOtpAttempt(otpScope);
    }

    await clearPendingApproval(provider, adminId, kind);
    await clearOtpAttempts(otpScope);

    const amount = Number(pending.payout.amount || 0);
    const currency = pending.payout.currency;
    if (amount > 0 && currency) {
      await assertAdminDailyPayoutLimits(adminId, amount, currency);
    }

    let payoutRecord = await recordAdminPayout({
      adminId,
      provider,
      payoutInput: pending.payout,
      status: "PROCESSING",
    });

    let result;
    try {
      result = await execute(pending.payout, payoutRecord.id);
    } catch (err) {
      await updateAdminPayout(payoutRecord.id, {
        status: "FAILED",
        failureReason: err.message,
      });
      throw err;
    }

    const external = extractExternalMeta(provider, result);
    payoutRecord = await updateAdminPayout(payoutRecord.id, {
      externalId: external.externalId || payoutRecord.id,
      externalStatus: external.externalStatus,
      providerResponse: result,
    });

    await sendPayoutInitiatedEmail(
      adminId,
      provider,
      providerLabel,
      pending.payout,
      result,
    );

    return {
      ...result,
      adminPayout: payoutRecord,
    };
  });
}

async function requestMbiyoPayPayoutApproval(adminId, payoutInput) {
  return requestPayoutApproval("mbiyopay", adminId, payoutInput, {
    validate: assertValidPayoutInput,
    providerLabel: "MbiyoPay",
    beneficiaryLabel: (p) => p.beneficiary,
    buildSummary: (p) => ({
      amount: p.amount,
      currency: p.currency,
      beneficiary: p.beneficiary,
      phoneNumber: p.phoneNumber,
      network: p.network,
    }),
  });
}

async function confirmMbiyoPayPayout(adminId, { pendingId, code }) {
  return confirmPayoutApproval(
    "mbiyopay",
    adminId,
    { pendingId, code },
    (payoutInput, adminPayoutId) =>
      initiateMbiyoPayPayout({ ...payoutInput, orderId: adminPayoutId }),
    "MbiyoPay",
  );
}

async function requestPawaPayPayoutApproval(adminId, payoutInput) {
  return requestPayoutApproval("pawapay", adminId, payoutInput, {
    validate: assertValidPawaPayPayoutInput,
    providerLabel: "PawaPay",
    beneficiaryLabel: (p) => p.recipientPhoneNumber,
    buildSummary: (p) => ({
      amount: p.amount,
      currency: p.currency,
      country: p.country,
      provider: p.provider,
      recipientPhoneNumber: p.recipientPhoneNumber,
    }),
  });
}

async function confirmPawaPayPayout(adminId, { pendingId, code }) {
  return confirmPayoutApproval(
    "pawapay",
    adminId,
    { pendingId, code },
    (payoutInput, adminPayoutId) =>
      initiatePawaPayPayout({ ...payoutInput, payoutId: adminPayoutId }),
    "PawaPay",
    "payout",
  );
}

async function requestPawaPayRefundApproval(adminId, refundInput) {
  return requestPayoutApproval("pawapay", adminId, refundInput, {
    validate: assertValidPawaPayRefundInput,
    providerLabel: "PawaPay Remboursement",
    beneficiaryLabel: (p) => p.depositId,
    buildSummary: (p) => ({
      depositId: p.depositId,
      amount: p.amount,
      currency: p.currency,
      country: p.country,
      provider: p.provider,
    }),
    kind: "refund",
  });
}

async function confirmPawaPayRefundApproval(adminId, { pendingId, code }) {
  return confirmPayoutApproval(
    "pawapay",
    adminId,
    { pendingId, code },
    (refundInput, adminPayoutId) =>
      initiatePawaPayRefund({ ...refundInput, refundId: adminPayoutId }),
    "PawaPay Remboursement",
    "refund",
  );
}

module.exports = {
  requestMbiyoPayPayoutApproval,
  confirmMbiyoPayPayout,
  requestPawaPayPayoutApproval,
  confirmPawaPayPayout,
  requestPawaPayRefundApproval,
  confirmPawaPayRefundApproval,
  assertValidPawaPayPayoutInput,
  assertValidPawaPayRefundInput,
};
