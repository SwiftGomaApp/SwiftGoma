const crypto = require("crypto");
const { getPrismaClient } = require("../../../config/prisma");
const { getRedisClient } = require("../../../config/redis");
const { env } = require("../../../config/env");
const {
  sendAdminPayoutOtpEmail,
  sendAdminPayoutInitiatedEmail,
} = require("../../../common/emails");
const { generateAuthOtp, safeCompareCode } = require("../../auth/utils/auth");
const {
  ValidationError,
  UnauthorizedError,
  AppError,
} = require("../../../common/errors");
const {
  initiatePayout: initiateMbiyoPayPayout,
} = require("./mbioyopay.service");
const { initiatePayout: initiatePawaPayPayout } = require("./pawapay.service");
const { recordAdminPayout, mapPayoutInput } = require("./adminPayout.service");
const { assertValidPayoutInput } = require("../utils/mbiyopay.utils");
const {
  isValidAmount,
  isValidMsisdn,
  isValidStatementDescription,
} = require("../utils/pawapay.utils");

const PAYOUT_OTP_TTL_MINUTES = 5;
const memoryStore = new Map();

function storeKey(provider, adminId) {
  return `${provider}-payout-approval:${adminId}`;
}

async function savePendingApproval(provider, adminId, data) {
  const key = storeKey(provider, adminId);
  const serialized = JSON.stringify(data);
  const redis = getRedisClient();
  if (redis) {
    await redis.setex(key, PAYOUT_OTP_TTL_MINUTES * 60, serialized);
    return;
  }
  memoryStore.set(key, data);
  setTimeout(() => memoryStore.delete(key), PAYOUT_OTP_TTL_MINUTES * 60 * 1000);
}

async function loadPendingApproval(provider, adminId) {
  const key = storeKey(provider, adminId);
  const redis = getRedisClient();
  if (redis) {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  }
  return memoryStore.get(key) || null;
}

async function clearPendingApproval(provider, adminId) {
  const key = storeKey(provider, adminId);
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
    throw new UnauthorizedError("Admin access required.");
  }

  const primary = user.emails.find((entry) => entry.isPrimary);
  const verified = user.emails.find((entry) => entry.isVerified);
  const email = primary?.email || verified?.email || user.emails[0]?.email;
  if (!email) {
    throw new ValidationError(
      "Your admin account has no email address — payout approval requires one.",
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
    throw new ValidationError("Invalid payout amount.");
  }
  if (!input.currency || !input.country || !input.provider) {
    throw new ValidationError("Currency, country, and provider are required.");
  }
  if (!isValidMsisdn(input.recipientPhoneNumber)) {
    throw new ValidationError("Invalid recipient phone number.");
  }
  if (!isValidStatementDescription(input.customerMessage)) {
    throw new ValidationError(
      "customerMessage must be 4-22 alphanumeric characters.",
    );
  }
}

async function requestPayoutApproval(
  provider,
  adminId,
  payoutInput,
  { validate, providerLabel, beneficiaryLabel, buildSummary },
) {
  validate(payoutInput);

  const { email, name } = await getAdminPrimaryEmail(adminId);
  const code = generateAuthOtp();
  const pendingId = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + PAYOUT_OTP_TTL_MINUTES * 60 * 1000,
  ).toISOString();

  await savePendingApproval(provider, adminId, {
    pendingId,
    code,
    expiresAt,
    provider,
    payout: payoutInput,
  });

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
    await clearPendingApproval(provider, adminId);
    console.error("[admin-payout] OTP email failed:", err.message);
    throw new AppError(
      "Failed to send payout verification email. Check SMTP configuration.",
      502,
      "PAYOUT_OTP_EMAIL_FAILED",
    );
  }

  return {
    pendingId,
    message: `A verification code was sent to ${email}. Enter it to approve this payout.`,
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
) {
  if (!pendingId || !code) {
    throw new ValidationError("Pending ID and verification code are required.");
  }

  const pending = await loadPendingApproval(provider, adminId);
  if (!pending) {
    throw new UnauthorizedError(
      "No pending payout approval found. Request a new code.",
    );
  }
  if (pending.pendingId !== pendingId) {
    throw new UnauthorizedError("Invalid payout approval session.");
  }
  if (pending.provider !== provider) {
    throw new UnauthorizedError("Payout provider mismatch.");
  }
  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    await clearPendingApproval(provider, adminId);
    throw new UnauthorizedError(
      "Verification code expired. Request a new payout approval.",
    );
  }
  if (!safeCompareCode(pending.code, code)) {
    throw new UnauthorizedError("Invalid verification code.");
  }

  await clearPendingApproval(provider, adminId);

  let result;
  try {
    result = await execute(pending.payout);
  } catch (err) {
    await recordAdminPayout({
      adminId,
      provider,
      payoutInput: pending.payout,
      status: "FAILED",
      failureReason: err.message,
    });
    throw err;
  }

  const record = await recordAdminPayout({
    adminId,
    provider,
    payoutInput: pending.payout,
    result,
    status: "PROCESSING",
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
    adminPayout: record,
  };
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
    initiateMbiyoPayPayout,
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
    initiatePawaPayPayout,
    "PawaPay",
  );
}

module.exports = {
  requestMbiyoPayPayoutApproval,
  confirmMbiyoPayPayout,
  requestPawaPayPayoutApproval,
  confirmPawaPayPayout,
  assertValidPawaPayPayoutInput,
};