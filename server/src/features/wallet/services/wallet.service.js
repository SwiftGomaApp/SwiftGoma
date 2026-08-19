const { getPrismaClient } = require("../../../config/prisma");
const { env } = require("../../../config/env");
const {
  NotFoundError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
  TooManyRequestsError,
} = require("../../../common/errors");
const { withLock } = require("../../../common/services/distributedLock");
const { WALLET_CONFIG } = require("../config/wallet.config");
const {
  initiatePayout: initiateMbiyoPayPayout,
  checkTransactionStatus,
} = require("../../payments/services/mbioyopay.service");
const cache = require("../../../common/services/cache");
const {
  generateVerificationOtp,
  getOtpExpiry,
  isOtpExpired,
  safeCompareCode,
} = require("../../auth/utils/auth");
const { sendSms } = require("../../../config/sms");
const { maskPhone } = require("../../users/utils/phone");
const { createQueue } = require("../../../config/queue");
const { QUEUE_NAMES } = require("../../../common/constants/queueNames");
const {
  generatePayoutReceipt,
} = require("../../invoicing/services/invoice.service");
const {
  payoutReceiptEmail,
} = require("../../../common/emails/templates/payoutReceipt");
const {
  createNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");
const {
  assertOtpNotLocked,
  handleInvalidOtpAttempt,
  clearOtpAttempts,
  sellerWalletOtpScope,
} = require("../../payments/utils/payoutSecurity");

const prisma = getPrismaClient();

function payoutOtpKey(sellerProfileId) {
  return `${WALLET_CONFIG.PAYOUT_OTP_CACHE_PREFIX}${sellerProfileId}`;
}

function assertValidCurrency(currency) {
  if (!WALLET_CONFIG.SUPPORTED_CURRENCIES.includes(currency)) {
    throw new ValidationError(`Devise "${currency}" non supportée.`);
  }
}

function assertValidAmount(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) {
    throw new ValidationError("Montant de payout invalide.");
  }
  return num;
}

async function getSellerProfileForPayout(sellerProfileId) {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
    include: { kyc: true, walletSettings: true },
  });
  if (!sellerProfile) {
    throw new NotFoundError("Profil vendeur introuvable.");
  }
  if (sellerProfile.status !== "ACTIVE") {
    throw new ConflictError("Le profil vendeur n'est pas actif.");
  }
  if (!sellerProfile.kyc || sellerProfile.kyc.status !== "APPROVED") {
    throw new ConflictError(
      "La vérification KYC doit être approuvée avant tout payout.",
    );
  }
  if (!sellerProfile.walletSettings) {
    throw new ConflictError(
      "Aucun paramètre de wallet configuré. Veuillez configurer votre numéro de payout d'abord.",
    );
  }
  return sellerProfile;
}

function serializeWalletBalance(balance) {
  return {
    currency: balance.currency,
    balance: Number(balance.balance),
  };
}

function serializeWalletTransaction(txn) {
  return {
    id: txn.id,
    type: txn.type,
    status: txn.status,
    amount: Number(txn.amount),
    currency: txn.currency,
    reason: txn.reason,
    balanceBefore: Number(txn.balanceBefore),
    balanceAfter: Number(txn.balanceAfter),
    orderId: txn.orderId,
    payoutOrderId: txn.payoutOrderId,
    payoutTransactionId: txn.payoutTransactionId,
    payoutFee: txn.payoutFee !== null ? Number(txn.payoutFee) : null,
    payoutChargedAmount:
      txn.payoutChargedAmount !== null ? Number(txn.payoutChargedAmount) : null,
    createdAt: txn.createdAt,
  };
}

function parsePagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    parseInt(query.limit, 10) || WALLET_CONFIG.DEFAULT_LIST_LIMIT,
    WALLET_CONFIG.MAX_LIST_LIMIT,
  );
  return { page, limit, skip: (page - 1) * limit };
}

function startOfUtcDay() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

async function assertWithinDailyPayoutLimit(wallet, currency, amount) {
  const dailyLimit = WALLET_CONFIG.DAILY_PAYOUT_LIMITS[currency];
  if (!dailyLimit) return;

  const { _sum } = await prisma.walletTransaction.aggregate({
    where: {
      walletId: wallet.id,
      currency,
      type: "PAYOUT_DEBIT",
      status: { in: ["PENDING", "COMPLETED"] },
      createdAt: { gte: startOfUtcDay() },
    },
    _sum: { amount: true },
  });

  const alreadyToday = Number(_sum.amount || 0);
  if (alreadyToday + amount > dailyLimit) {
    throw new ConflictError(
      `Limite de payout journalière atteinte pour ${currency} (${dailyLimit} max/jour, ${alreadyToday} déjà envoyé aujourd'hui).`,
    );
  }
}

async function applyPayoutConfirmed(walletTransaction) {
  if (walletTransaction.status === "COMPLETED") {
    return walletTransaction;
  }
  if (walletTransaction.status === "FAILED") {
    console.error(
      `[wallet] Payout ${walletTransaction.id} confirmed by MbiyoPay but was already marked FAILED locally — leaving as-is for manual review.`,
    );
    return walletTransaction;
  }

  const updatedTransaction = await prisma.walletTransaction.update({
    where: { id: walletTransaction.id },
    data: { status: "COMPLETED" },
  });

  try {
    await createQueue(QUEUE_NAMES.INVOICES).add("wallet-payout-receipt", {
      walletTransactionId: updatedTransaction.id,
    });
  } catch (err) {
    console.error(
      `[wallet] Failed to enqueue payout receipt job for transaction ${updatedTransaction.id}:`,
      err.message,
    );
  }

  return updatedTransaction;
}

async function applyPayoutFailed(walletTransaction, failureReason) {
  if (walletTransaction.status === "FAILED") {
    return walletTransaction;
  }
  if (walletTransaction.status === "COMPLETED") {
    console.error(
      `[wallet] Payout ${walletTransaction.id} failed per MbiyoPay but was already marked COMPLETED locally — leaving as-is for manual review.`,
    );
    return walletTransaction;
  }

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.walletTransaction.updateMany({
      where: { id: walletTransaction.id, status: "PENDING" },
      data: { status: "FAILED", reason: failureReason },
    });
    if (claimed.count !== 1) {
      return tx.walletTransaction.findUnique({
        where: { id: walletTransaction.id },
      });
    }

    await tx.walletBalance.update({
      where: { id: walletTransaction.walletBalanceId },
      data: { balance: { increment: Number(walletTransaction.amount) } },
    });

    return tx.walletTransaction.findUnique({
      where: { id: walletTransaction.id },
    });
  });
}

async function getWalletOverview(sellerProfileId) {
  const wallet = await prisma.wallet.findUnique({
    where: { sellerProfileId },
    include: { balances: true },
  });

  if (!wallet) {
    return { walletId: null, balances: [] };
  }

  return {
    walletId: wallet.id,
    balances: wallet.balances.map(serializeWalletBalance),
  };
}

async function listWalletTransactions(sellerProfileId, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const { currency, type } = query;

  if (currency) assertValidCurrency(currency);
  if (type && !WALLET_CONFIG.TRANSACTION_TYPES.includes(type)) {
    throw new ValidationError(`Type de transaction "${type}" invalide.`);
  }

  const wallet = await prisma.wallet.findUnique({
    where: { sellerProfileId },
  });
  if (!wallet) {
    return { transactions: [], total: 0, page, limit, totalPages: 1 };
  }

  const where = {
    walletId: wallet.id,
    ...(currency ? { currency } : {}),
    ...(type ? { type } : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return {
    transactions: transactions.map(serializeWalletTransaction),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async function debitWalletForPayout(sellerProfileId, currency, amount) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { sellerProfileId } });
    if (!wallet) {
      throw new ConflictError("Aucun wallet trouvé pour ce vendeur.");
    }

    const walletBalance = await tx.walletBalance.findUnique({
      where: { walletId_currency: { walletId: wallet.id, currency } },
    });
    if (!walletBalance || Number(walletBalance.balance) < amount) {
      throw new ConflictError("Solde insuffisant pour ce payout.");
    }

    const debited = await tx.walletBalance.updateMany({
      where: { id: walletBalance.id, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (debited.count !== 1) {
      throw new ConflictError("Solde insuffisant pour ce payout.");
    }

    const updatedBalance = await tx.walletBalance.findUnique({
      where: { id: walletBalance.id },
    });
    const balanceAfter = Number(updatedBalance.balance);
    const balanceBefore = balanceAfter + amount;

    const walletTransaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        walletBalanceId: walletBalance.id,
        type: "PAYOUT_DEBIT",
        status: "PENDING",
        amount,
        currency,
        reason: "Demande de payout vendeur",
        balanceBefore,
        balanceAfter,
      },
    });

    return { wallet, walletBalance: updatedBalance, walletTransaction };
  });
}

async function refundFailedPayout(
  walletBalanceId,
  walletTransactionId,
  amount,
  failureReason,
) {
  await prisma.$transaction(async (tx) => {
    const updatedBalance = await tx.walletBalance.update({
      where: { id: walletBalanceId },
      data: { balance: { increment: amount } },
    });

    await tx.walletTransaction.update({
      where: { id: walletTransactionId },
      data: {
        status: "FAILED",
        reason: failureReason,
      },
    });

    return updatedBalance;
  });
}

async function requestPayoutOtp(sellerProfileId) {
  if (!cache.isAvailable()) {
    throw new ConflictError(
      "L'authentification par OTP est temporairement indisponible.",
    );
  }

  const sellerProfile = await getSellerProfileForPayout(sellerProfileId);
  const { walletSettings } = sellerProfile;
  const key = payoutOtpKey(sellerProfileId);

  const existing = await cache.get(key);
  if (existing) {
    const cooldownEndsAt =
      new Date(existing.createdAt).getTime() +
      WALLET_CONFIG.PAYOUT_OTP_RESEND_COOLDOWN_SECONDS * 1000;
    const now = Date.now();
    if (cooldownEndsAt > now) {
      const secondsLeft = Math.ceil((cooldownEndsAt - now) / 1000);
      throw new TooManyRequestsError(
        `Veuillez patienter ${secondsLeft} secondes avant de demander un nouveau code.`,
      );
    }
  }

  const code = generateVerificationOtp();
  const expiresAt = getOtpExpiry(WALLET_CONFIG.PAYOUT_OTP_TTL_MINUTES);

  await cache.set(
    key,
    { code, createdAt: new Date().toISOString(), expiresAt },
    WALLET_CONFIG.PAYOUT_OTP_TTL_MINUTES * 60,
  );

  try {
    await sendSms({
      to: walletSettings.payoutPhoneNumber,
      message: `${code} est votre code de confirmation de payout Swiftgoma. Il expire dans ${WALLET_CONFIG.PAYOUT_OTP_TTL_MINUTES} minutes. Ne le partagez avec personne.`,
    });
  } catch (err) {
    console.error(
      `[wallet] Failed to send payout OTP SMS for seller ${sellerProfileId}:`,
      err.message,
    );
    await cache.del(key);
    throw new ConflictError(
      "Impossible d'envoyer le code de confirmation. Veuillez réessayer.",
    );
  }

  return {
    message: "Un code de confirmation a été envoyé par SMS.",
    maskedPhone: maskPhone(walletSettings.payoutPhoneNumber),
    expiresInMinutes: WALLET_CONFIG.PAYOUT_OTP_TTL_MINUTES,
  };
}

async function verifyAndConsumePayoutOtp(sellerProfileId, otpCode) {
  const otpScope = sellerWalletOtpScope(sellerProfileId);
  await assertOtpNotLocked(otpScope);

  const key = payoutOtpKey(sellerProfileId);
  const stored = await cache.get(key);

  if (!stored || isOtpExpired(stored.expiresAt)) {
    throw new ValidationError(
      "Le code de confirmation a expiré. Veuillez en demander un nouveau.",
    );
  }
  if (!safeCompareCode(stored.code, otpCode)) {
    await handleInvalidOtpAttempt(otpScope, "Code de confirmation invalide.");
  }

  await cache.del(key);
  await clearOtpAttempts(otpScope);
}

async function initiateSellerPayout({
  sellerProfileId,
  currency,
  amount,
  otpCode,
}) {
  assertValidCurrency(currency);
  const validAmount = assertValidAmount(amount);

  if (!otpCode || typeof otpCode !== "string") {
    throw new ValidationError("Code de confirmation OTP requis.");
  }

  const lockKey = `${WALLET_CONFIG.PAYOUT_LOCK_PREFIX}${sellerProfileId}`;

  const result = await withLock(
    lockKey,
    WALLET_CONFIG.PAYOUT_LOCK_TTL_MS,
    async () => {
      const sellerProfile = await getSellerProfileForPayout(sellerProfileId);
      const { walletSettings } = sellerProfile;

      await verifyAndConsumePayoutOtp(sellerProfileId, otpCode);

      const minimumEntry = await prisma.minimumPayoutAmount.findUnique({
        where: {
          walletSettingsId_currency: {
            walletSettingsId: walletSettings.id,
            currency,
          },
        },
      });
      if (minimumEntry && validAmount < Number(minimumEntry.amount)) {
        throw new ValidationError(
          `Le montant minimum de payout pour ${currency} est ${minimumEntry.amount}.`,
        );
      }

      const wallet = await prisma.wallet.findUnique({
        where: { sellerProfileId },
      });
      if (!wallet) {
        throw new ConflictError("Aucun wallet trouvé pour ce vendeur.");
      }
      await assertWithinDailyPayoutLimit(wallet, currency, validAmount);

      const { walletBalance, walletTransaction } = await debitWalletForPayout(
        sellerProfileId,
        currency,
        validAmount,
      );

      try {
        const payoutResult = await initiateMbiyoPayPayout({
          amount: validAmount,
          currency,
          network: walletSettings.payoutProvider,
          phoneNumber: walletSettings.payoutPhoneNumber,
          countryCode: walletSettings.payoutCountry,
          beneficiary: sellerProfile.businessName,
          orderId: `SWG-PAYOUT-${walletTransaction.id}`,
        });

        const updatedTransaction = await prisma.walletTransaction.update({
          where: { id: walletTransaction.id },
          data: {
            payoutOrderId: payoutResult.orderId || null,
            payoutTransactionId: payoutResult.transaction_id || null,
            payoutFee:
              payoutResult.fee !== undefined ? String(payoutResult.fee) : null,
            payoutChargedAmount:
              payoutResult.charged_amount !== undefined
                ? String(payoutResult.charged_amount)
                : null,
          },
        });

        return {
          walletTransaction: serializeWalletTransaction(updatedTransaction),
          balance: serializeWalletBalance(walletBalance),
        };
      } catch (err) {
        console.error(
          `[wallet] MbiyoPay payout failed for seller ${sellerProfileId}, wallet transaction ${walletTransaction.id} — refunding:`,
          err.message,
        );
        await refundFailedPayout(
          walletBalance.id,
          walletTransaction.id,
          validAmount,
          err.message || "Échec de l'initiation du payout MbiyoPay",
        );
        throw err;
      }
    },
  );

  if (result === null) {
    throw new ConflictError(
      "Une demande de payout est déjà en cours de traitement pour ce vendeur. Veuillez patienter quelques secondes et réessayer.",
    );
  }

  return result;
}

async function findPayoutTransactionForCallback({ transactionId, orderId }) {
  let walletTransaction = await prisma.walletTransaction.findFirst({
    where: { payoutTransactionId: transactionId, type: "PAYOUT_DEBIT" },
  });

  if (!walletTransaction && orderId) {
    walletTransaction = await prisma.walletTransaction.findFirst({
      where: { payoutOrderId: orderId, type: "PAYOUT_DEBIT" },
    });

    if (walletTransaction && !walletTransaction.payoutTransactionId) {
      walletTransaction = await prisma.walletTransaction.update({
        where: { id: walletTransaction.id },
        data: { payoutTransactionId: transactionId },
      });
    }
  }

  return walletTransaction;
}

async function confirmSellerPayout(transactionId, orderId) {
  const walletTransaction = await findPayoutTransactionForCallback({
    transactionId,
    orderId,
  });
  if (!walletTransaction) {
    throw new NotFoundError("Transaction de payout introuvable.");
  }
  return applyPayoutConfirmed(walletTransaction);
}

async function failSellerPayout(transactionId, failureReason, orderId) {
  const walletTransaction = await findPayoutTransactionForCallback({
    transactionId,
    orderId,
  });
  if (!walletTransaction) {
    throw new NotFoundError("Transaction de payout introuvable.");
  }
  return applyPayoutFailed(walletTransaction, failureReason);
}

async function sendPayoutReceiptDocument(walletTransactionId) {
  const walletTransaction = await prisma.walletTransaction.findUnique({
    where: { id: walletTransactionId },
    include: {
      wallet: {
        include: {
          sellerProfile: {
            include: { user: true, walletSettings: true },
          },
        },
      },
    },
  });
  if (!walletTransaction) {
    throw new NotFoundError("Transaction de payout introuvable.");
  }

  const { sellerProfile } = walletTransaction.wallet;
  const seller = sellerProfile.user;

  let receiptRecord;
  let receiptBuffer;
  try {
    const receipt = await generatePayoutReceipt(walletTransactionId);
    receiptRecord = receipt.record;
    receiptBuffer = receipt.pdfBuffer;
  } catch (err) {
    console.error(
      `[wallet] Failed to generate payout receipt for transaction ${walletTransactionId}:`,
      err.message,
    );
    throw err;
  }

  if (!receiptBuffer) return receiptRecord;

  const emailContent = payoutReceiptEmail({
    name: seller.name,
    documentNumber: receiptRecord.documentNumber,
    amount: `${Number(walletTransaction.amount).toFixed(2)} ${walletTransaction.currency}`,
    date: new Date(walletTransaction.createdAt).toLocaleDateString("fr-FR"),
    payoutPhoneNumber: sellerProfile.walletSettings?.payoutPhoneNumber || "",
    walletUrl: `${env.appUrl}/seller/wallet`,
    receiptBuffer,
    locale: "fr",
  });

  try {
    await createNotification({
      userId: seller.id,
      type: NOTIFICATION_TYPES.PAYMENT,
      title: emailContent.subject,
      body: `Un payout de ${Number(walletTransaction.amount).toFixed(2)} ${walletTransaction.currency} a été envoyé sur votre compte mobile money. Reçu ci-joint.`,
      data: {
        action: "walletPayoutCompleted",
        walletTransactionId: walletTransaction.id,
      },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error(
      `[wallet] Failed to send payout receipt email for transaction ${walletTransactionId}:`,
      err.message,
    );
    throw err;
  }

  return receiptRecord;
}

async function reconcileOnePendingPayout(walletTransaction) {
  const reference =
    walletTransaction.payoutTransactionId || walletTransaction.payoutOrderId;
  if (!reference) {
    console.error(
      `[wallet] Pending payout ${walletTransaction.id} has no payoutTransactionId/payoutOrderId to reconcile — skipping.`,
    );
    return null;
  }

  let status;
  try {
    const result = await checkTransactionStatus(reference);
    status = result?.status;
  } catch (err) {
    console.error(
      `[wallet] Reconciliation status check failed for payout ${walletTransaction.id} (${reference}):`,
      err.message,
    );
    return null;
  }

  if (status === "successful") {
    return applyPayoutConfirmed(walletTransaction);
  }
  if (status === "failed" || status === "cancelled") {
    return applyPayoutFailed(
      walletTransaction,
      `MbiyoPay payout ${status} (reconciled via status poll)`,
    );
  }

  return null;
}

async function reconcilePendingPayouts() {
  const threshold = new Date(
    Date.now() -
      WALLET_CONFIG.PENDING_PAYOUT_RECONCILE_AFTER_MINUTES * 60 * 1000,
  );

  const stalePayouts = await prisma.walletTransaction.findMany({
    where: {
      type: "PAYOUT_DEBIT",
      status: "PENDING",
      createdAt: { lte: threshold },
    },
  });

  const results = await Promise.allSettled(
    stalePayouts.map((txn) => reconcileOnePendingPayout(txn)),
  );

  return results.filter((r) => r.status === "fulfilled" && r.value).length;
}

async function notifyPayoutRetriesExhausted(walletTransaction) {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletTransaction.walletId },
      include: {
        sellerProfile: { include: { user: true, walletSettings: true } },
      },
    });
    if (!wallet) return;
    const seller = wallet.sellerProfile.user;
    const phoneNumber = wallet.sellerProfile.walletSettings?.payoutPhoneNumber;

    await createNotification({
      userId: seller.id,
      type: NOTIFICATION_TYPES.PAYMENT,
      title: "Votre payout a échoué — vérifiez votre numéro et réessayez",
      body: `Votre payout de ${Number(walletTransaction.amount).toFixed(2)} ${walletTransaction.currency} n'a pas pu être envoyé après ${WALLET_CONFIG.MAX_PAYOUT_RETRIES + 1} tentative(s)${phoneNumber ? ` (numéro enregistré : ${maskPhone(phoneNumber)})` : ""}. Le montant est resté dans votre wallet, aucun argent n'a été perdu. Vérifiez que votre numéro mobile money est correct et actif, puis relancez un payout depuis votre wallet.`,
      data: {
        action: "walletPayoutRetriesExhausted",
        walletTransactionId: walletTransaction.id,
      },
    });
  } catch (err) {
    console.error(
      `[wallet] Failed to notify seller of exhausted payout retries for transaction ${walletTransaction.id}:`,
      err.message,
    );
  }
}

module.exports = {
  getWalletOverview,
  listWalletTransactions,
  requestPayoutOtp,
  initiateSellerPayout,
  confirmSellerPayout,
  failSellerPayout,
  reconcilePendingPayouts,
  sendPayoutReceiptDocument,
};
