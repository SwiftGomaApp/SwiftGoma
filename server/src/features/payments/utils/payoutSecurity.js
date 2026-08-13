const { getRedisClient } = require("../../../config/redis");
const { getPrismaClient } = require("../../../config/prisma");
const {
  TooManyRequestsError,
  ConflictError,
  UnauthorizedError,
} = require("../../../common/errors");
const { PAYOUT_SECURITY_CONFIG } = require("../config/payoutSecurity.config");

const prisma = getPrismaClient();

const memoryCooldowns = new Map();
const memoryFailCounts = new Map();
const memoryLocks = new Map();

function startOfUtcDay() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

async function readCounter(key) {
  const redis = getRedisClient();
  if (redis) {
    const raw = await redis.get(key);
    return raw ? Number(raw) : 0;
  }
  return memoryFailCounts.get(key) || 0;
}

async function writeCounter(key, value, ttlSeconds) {
  const redis = getRedisClient();
  if (redis) {
    await redis.setex(key, ttlSeconds, String(value));
    return;
  }
  memoryFailCounts.set(key, value);
  setTimeout(() => memoryFailCounts.delete(key), ttlSeconds * 1000).unref?.();
}

async function deleteKeys(...keys) {
  const redis = getRedisClient();
  if (redis) {
    if (keys.length) await redis.del(...keys);
    return;
  }
  for (const key of keys) {
    memoryFailCounts.delete(key);
    memoryLocks.delete(key);
    memoryCooldowns.delete(key);
  }
}

function lockKey(scope) {
  return `payout-otp-lock:${scope}`;
}

function failKey(scope) {
  return `payout-otp-fail:${scope}`;
}

function cooldownKey(scope) {
  return `payout-otp-cooldown:${scope}`;
}

function confirmLockKey(userId) {
  return `payout-confirm-lock:${userId}`;
}

async function assertOtpNotLocked(scope) {
  const redis = getRedisClient();
  const key = lockKey(scope);
  if (redis) {
    const locked = await redis.get(key);
    if (locked) {
      throw new TooManyRequestsError(
        "Trop de tentatives de vérification invalides. Veuillez patienter avant de réessayer.",
      );
    }
    return;
  }
  if (memoryLocks.has(key)) {
    throw new TooManyRequestsError(
      "Trop de tentatives de vérification invalides. Veuillez patienter avant de réessayer.",
    );
  }
}

async function handleInvalidOtpAttempt(
  scope,
  invalidMessage = "Code de vérification invalide.",
) {
  await assertOtpNotLocked(scope);

  const key = failKey(scope);
  const lockoutSeconds = PAYOUT_SECURITY_CONFIG.OTP_LOCKOUT_MINUTES * 60;
  const current = (await readCounter(key)) + 1;

  if (current >= PAYOUT_SECURITY_CONFIG.OTP_MAX_FAILED_ATTEMPTS) {
    const redis = getRedisClient();
    const lock = lockKey(scope);
    if (redis) {
      await redis.setex(lock, lockoutSeconds, "1");
      await redis.del(key);
    } else {
      memoryLocks.set(lock, true);
      memoryFailCounts.delete(key);
      setTimeout(() => memoryLocks.delete(lock), lockoutSeconds * 1000).unref?.();
    }
    throw new TooManyRequestsError(
      "Trop de tentatives de vérification invalides. Veuillez patienter avant de réessayer.",
    );
  }

  await writeCounter(key, current, lockoutSeconds);
  throw new UnauthorizedError(invalidMessage);
}

async function clearOtpAttempts(scope) {
  await deleteKeys(failKey(scope), lockKey(scope));
}

async function assertOtpResendCooldown(scope) {
  const redis = getRedisClient();
  const key = cooldownKey(scope);
  const cooldownMs =
    PAYOUT_SECURITY_CONFIG.OTP_RESEND_COOLDOWN_SECONDS * 1000;

  if (redis) {
    const lastSent = await redis.get(key);
    if (lastSent) {
      const elapsed = Date.now() - Number(lastSent);
      if (elapsed < cooldownMs) {
        const secondsLeft = Math.ceil((cooldownMs - elapsed) / 1000);
        throw new TooManyRequestsError(
          `Veuillez patienter ${secondsLeft} secondes avant de demander un nouveau code de vérification.`,
        );
      }
    }
    return;
  }

  const lastSent = memoryCooldowns.get(key);
  if (lastSent && Date.now() - lastSent < cooldownMs) {
    const secondsLeft = Math.ceil(
      (cooldownMs - (Date.now() - lastSent)) / 1000,
    );
    throw new TooManyRequestsError(
      `Veuillez patienter ${secondsLeft} secondes avant de demander un nouveau code de vérification.`,
    );
  }
}

async function markOtpSent(scope) {
  const redis = getRedisClient();
  const key = cooldownKey(scope);
  const ttl = PAYOUT_SECURITY_CONFIG.OTP_RESEND_COOLDOWN_SECONDS;

  if (redis) {
    await redis.setex(key, ttl, String(Date.now()));
    return;
  }
  memoryCooldowns.set(key, Date.now());
  setTimeout(() => memoryCooldowns.delete(key), ttl * 1000).unref?.();
}

async function assertAdminDailyPayoutLimits(adminId, amount, currency) {
  const since = startOfUtcDay();
  const dailyCount = await prisma.adminPayout.count({
    where: {
      adminId,
      createdAt: { gte: since },
      status: { in: ["PROCESSING", "COMPLETED"] },
    },
  });

  if (dailyCount >= PAYOUT_SECURITY_CONFIG.ADMIN_DAILY_PAYOUT_MAX_COUNT) {
    throw new ConflictError(
      `Limite quotidienne de paiements administrateur atteinte (${PAYOUT_SECURITY_CONFIG.ADMIN_DAILY_PAYOUT_MAX_COUNT} par jour).`,
    );
  }

  const amountLimit =
    PAYOUT_SECURITY_CONFIG.ADMIN_DAILY_PAYOUT_AMOUNT_LIMITS[currency];
  if (!amountLimit) return;

  const { _sum } = await prisma.adminPayout.aggregate({
    where: {
      adminId,
      currency,
      createdAt: { gte: since },
      status: { in: ["PROCESSING", "COMPLETED"] },
    },
    _sum: { amount: true },
  });

  const alreadyToday = Number(_sum.amount || 0);
  const nextTotal = alreadyToday + Number(amount);
  if (nextTotal > amountLimit) {
    throw new ConflictError(
      `Limite quotidienne de montant atteinte pour ${currency} (${amountLimit} max/jour, ${alreadyToday} déjà envoyés aujourd'hui).`,
    );
  }
}

async function withPayoutConfirmLock(userId, fn) {
  const redis = getRedisClient();
  const key = confirmLockKey(userId);
  const ttlMs = PAYOUT_SECURITY_CONFIG.CONFIRM_LOCK_TTL_MS;
  const token = `${process.pid}-${Date.now()}`;

  if (redis) {
    const acquired = await redis.set(key, token, "PX", ttlMs, "NX");
    if (!acquired) {
      throw new TooManyRequestsError(
        "Une confirmation de paiement est déjà en cours. Veuillez patienter.",
      );
    }
    try {
      return await fn();
    } finally {
      const current = await redis.get(key);
      if (current === token) await redis.del(key);
    }
  }

  if (memoryLocks.has(key)) {
    throw new TooManyRequestsError(
      "Une confirmation de paiement est déjà en cours. Veuillez patienter.",
    );
  }
  memoryLocks.set(key, token);
  try {
    return await fn();
  } finally {
    if (memoryLocks.get(key) === token) memoryLocks.delete(key);
  }
}

function adminPayoutOtpScope(provider, adminId) {
  return `admin-payout:${provider}:${adminId}`;
}

function adminRefundOtpScope(provider, adminId) {
  return `admin-refund:${provider}:${adminId}`;
}

function adminExpenseOtpScope(adminId) {
  return `admin-expense:${adminId}`;
}

function sellerWalletOtpScope(sellerProfileId) {
  return `seller-wallet:${sellerProfileId}`;
}

function adminOrderRefundOtpScope(adminId) {
  return `admin-order-refund:${adminId}`;
}

module.exports = {
  assertOtpNotLocked,
  handleInvalidOtpAttempt,
  clearOtpAttempts,
  assertOtpResendCooldown,
  markOtpSent,
  assertAdminDailyPayoutLimits,
  withPayoutConfirmLock,
  adminPayoutOtpScope,
  adminRefundOtpScope,
  adminExpenseOtpScope,
  sellerWalletOtpScope,
  adminOrderRefundOtpScope,
};
