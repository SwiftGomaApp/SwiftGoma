const crypto = require("crypto");
const { getRedisClient } = require("../../../config/redis");
const { env } = require("../../../config/env");
const {
  sendAdminPayoutOtpEmail,
} = require("../../../common/emails");
const { generateAuthOtp, safeCompareCode } = require("../../auth/utils/auth");
const {
  ValidationError,
  UnauthorizedError,
  BadRequestError,
  AppError,
} = require("../../../common/errors");
const { initiatePayout } = require("../../payments/services/mbioyopay.service");
const {
  recordAdminPayout,
  updateAdminPayout,
} = require("../../payments/services/adminPayout.service");
const {
  assertOtpNotLocked,
  assertOtpResendCooldown,
  markOtpSent,
  handleInvalidOtpAttempt,
  clearOtpAttempts,
  assertAdminDailyPayoutLimits,
  withPayoutConfirmLock,
  adminOrderRefundOtpScope,
} = require("../../payments/utils/payoutSecurity");
const { getPrismaClient } = require("../../../config/prisma");

const prisma = getPrismaClient();
const APPROVAL_TTL_MINUTES = 5;
const REFUNDABLE_STATUSES = ["CANCELLED", "REJECTED", "EXPIRED", "FAILED"];
const memoryStore = new Map();

function storeKey(adminId) {
  return `order-refund-approval:${adminId}`;
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
  memoryStore.set(key, data);
  setTimeout(() => memoryStore.delete(key), APPROVAL_TTL_MINUTES * 60 * 1000);
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
  memoryStore.delete(key);
}

async function getAdminPrimaryEmail(adminId) {
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

async function loadRefundableOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      buyer: { select: { id: true, name: true } },
    },
  });
  if (!order) {
    throw new BadRequestError("Commande introuvable.");
  }
  if (order.paymentMethod !== "ONLINE_PAYMENT" || !order.payment) {
    throw new BadRequestError(
      "Cette commande n'a pas de paiement en ligne à rembourser.",
    );
  }
  if (order.payment.status !== "SUCCEEDED") {
    throw new BadRequestError(
      "Seuls les paiements réussis non remboursés peuvent être remboursés.",
    );
  }
  if (!REFUNDABLE_STATUSES.includes(order.status)) {
    throw new BadRequestError(
      "Remboursement manuel autorisé uniquement pour commandes annulées, rejetées, expirées ou échouées.",
    );
  }
  return order;
}

function buildRefundSummary(order) {
  return {
    orderId: order.id,
    amount: Number(order.payment.amount),
    currency: order.payment.currency,
    beneficiary: `${order.buyer.name} (remboursement)`,
    phoneNumber: order.payment.phoneNumber,
    network: order.payment.network,
  };
}

async function requestAdminOrderRefundApproval(adminId, orderId) {
  const otpScope = adminOrderRefundOtpScope(adminId);
  await assertOtpResendCooldown(otpScope);

  const order = await loadRefundableOrder(orderId);
  const summary = buildRefundSummary(order);
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
    orderId,
    summary,
  });

  try {
    await sendAdminPayoutOtpEmail(email, {
      name,
      code,
      amount: summary.amount,
      currency: summary.currency,
      beneficiary: summary.beneficiary,
      providerLabel: "MbiyoPay (remboursement commande)",
      expiresInMinutes: APPROVAL_TTL_MINUTES,
      locale: "fr",
    });
  } catch (err) {
    await clearPending(adminId);
    console.error("[order-refund-approval] OTP email failed:", err.message);
    throw new AppError(
      "Impossible d'envoyer l'e-mail de vérification. Vérifiez la configuration SMTP.",
      502,
      "ORDER_REFUND_OTP_EMAIL_FAILED",
    );
  }

  await markOtpSent(otpScope);

  return {
    pendingId,
    message: `Un code de vérification a été envoyé à ${email}.`,
    expiresInMinutes: APPROVAL_TTL_MINUTES,
    summary,
  };
}

async function confirmAdminOrderRefundApproval(adminId, orderId, { pendingId, code }) {
  if (!pendingId || !code) {
    throw new ValidationError("Identifiant de session et code requis.");
  }

  const otpScope = adminOrderRefundOtpScope(adminId);

  return withPayoutConfirmLock(adminId, async () => {
    await assertOtpNotLocked(otpScope);

    const pending = await loadPending(adminId);
    if (!pending) {
      throw new UnauthorizedError(
        "Aucune approbation en attente. Demandez un nouveau code.",
      );
    }
    if (pending.pendingId !== pendingId) {
      throw new UnauthorizedError("Session d'approbation invalide.");
    }
    if (pending.orderId !== orderId) {
      throw new UnauthorizedError("La commande ne correspond pas à la session.");
    }
    if (isPendingExpired(pending)) {
      await clearPending(adminId);
      throw new UnauthorizedError("Code expiré. Demandez une nouvelle approbation.");
    }
    if (!safeCompareCode(pending.code, code)) {
      await handleInvalidOtpAttempt(otpScope, "Code de vérification invalide.");
    }

    await clearPending(adminId);
    await clearOtpAttempts(otpScope);

    const order = await loadRefundableOrder(orderId);
    const amount = Number(order.payment.amount);
    const currency = order.payment.currency;
    await assertAdminDailyPayoutLimits(adminId, amount, currency);

    const payoutInput = {
      amount,
      currency,
      network: order.payment.network,
      phoneNumber: order.payment.phoneNumber,
      countryCode: order.payment.countryCode,
      beneficiary: `${order.buyer.name} (remboursement)`,
    };

    let payoutRecord = await recordAdminPayout({
      adminId,
      provider: "mbiyopay",
      payoutInput,
      status: "PROCESSING",
    });

    const claimed = await prisma.orderPayment.updateMany({
      where: { id: order.payment.id, status: "SUCCEEDED" },
      data: { status: "REFUNDED", refundedAt: new Date() },
    });
    if (claimed.count !== 1) {
      await updateAdminPayout(payoutRecord.id, {
        status: "FAILED",
        failureReason: "Paiement déjà remboursé ou indisponible.",
      });
      throw new BadRequestError(
        "Ce paiement a déjà été remboursé ou n'est plus éligible.",
      );
    }

    try {
      const refund = await initiatePayout({
        ...payoutInput,
        orderId: `SWG-REFUND-${order.id}`,
      });

      await prisma.orderPayment.update({
        where: { id: order.payment.id },
        data: {
          payoutOrderId: refund.orderId,
          payoutTransactionId: refund.transaction_id,
        },
      });

      payoutRecord = await updateAdminPayout(payoutRecord.id, {
        externalId: refund.orderId || refund.transaction_id || payoutRecord.id,
        externalStatus: refund.status || null,
        providerResponse: refund,
      });
    } catch (err) {
      await prisma.orderPayment
        .update({
          where: { id: order.payment.id },
          data: {
            status: "SUCCEEDED",
            refundedAt: null,
            failureReason: `Échec du remboursement : ${err.message}`,
          },
        })
        .catch(() => {});
      await updateAdminPayout(payoutRecord.id, {
        status: "FAILED",
        failureReason: err.message,
      });
      throw new BadRequestError(`Le remboursement a échoué : ${err.message}`);
    }

    return { orderId, adminPayout: payoutRecord };
  });
}

module.exports = {
  requestAdminOrderRefundApproval,
  confirmAdminOrderRefundApproval,
};
