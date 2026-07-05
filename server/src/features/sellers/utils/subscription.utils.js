"use strict";

const { setEx, get, del } = require("../../../config/redis.config");
const { AppError, errors } = require("../../../shared/errors/app.error");
const { sendOtpEmail } = require("../../../services/email.service");
const { sendOtpSms } = require("../../../services/sms.service");
const {
  REDIS_PREFIX,
  PENDING_ACTION_TTL_SECONDS,
  DEPOSIT_CONTEXT_TTL_SECONDS,
  BILLING_CYCLE_MONTHS,
} = require("../constants/subscription.constants");

function pendingActionKey(userId, pendingId) {
  return `${REDIS_PREFIX.PENDING_ACTION}:${userId}:${pendingId}`;
}

async function savePendingAction(userId, pendingId, payload) {
  await setEx(
    pendingActionKey(userId, pendingId),
    payload,
    PENDING_ACTION_TTL_SECONDS,
  );
}

async function getPendingAction(userId, pendingId) {
  let data;
  try {
    data = await get(pendingActionKey(userId, pendingId));
  } catch {
    data = null;
  }

  if (!data) {
    throw errors.badRequest(
      "Cette demande a expiré ou est invalide. Veuillez recommencer.",
    );
  }

  return data;
}

async function clearPendingAction(userId, pendingId) {
  await del(pendingActionKey(userId, pendingId));
}

function depositContextKey(depositId) {
  return `${REDIS_PREFIX.DEPOSIT_CONTEXT}:${depositId}`;
}

async function saveDepositContext(depositId, payload) {
  await setEx(
    depositContextKey(depositId),
    payload,
    DEPOSIT_CONTEXT_TTL_SECONDS,
  );
}

async function getDepositContext(depositId) {
  try {
    return await get(depositContextKey(depositId));
  } catch {
    return null;
  }
}

async function clearDepositContext(depositId) {
  await del(depositContextKey(depositId));
}

async function dispatchOtpToUser(user, code) {
  if (user.email) {
    await sendOtpEmail({
      to: user.email,
      name: user.name,
      code,
      context: "signin",
    });
    return { channel: "email", target: user.email };
  }

  if (user.phone) {
    await sendOtpSms({ to: user.phone, code });
    return { channel: "sms", target: user.phone };
  }

  throw new AppError(
    "Aucun email ou numéro de téléphone n'est associé à ce compte pour l'envoi du code.",
    400,
    "NO_OTP_DESTINATION",
  );
}

function resolvePlanPrice(plan, country, currency) {
  const price =
    plan.prices.find((p) => p.country === country && p.currency === currency) ||
    plan.prices.find((p) => p.country === country && p.isDefault);

  if (!price) {
    throw errors.badRequest(
      `Aucun tarif disponible pour ce plan dans ${country} (${currency || ""}).`,
    );
  }

  return price;
}

function computeAmount(priceMonthly, billingCycle) {
  const months = BILLING_CYCLE_MONTHS[billingCycle] || 1;
  return Math.round(Number(priceMonthly) * months * 100) / 100;
}

function computeExpiryDate(fromDate, billingCycle) {
  const date = new Date(fromDate);
  const months = BILLING_CYCLE_MONTHS[billingCycle] || 1;
  date.setMonth(date.getMonth() + months);
  return date;
}

function serializeSubscription(subscription) {
  if (!subscription) return null;
  return {
    id: subscription.id,
    sellerProfileId: subscription.sellerProfileId,
    plan: subscription.plan
      ? {
          id: subscription.plan.id,
          name: subscription.plan.name,
          slug: subscription.plan.slug,
        }
      : undefined,
    country: subscription.country,
    currency: subscription.currency,
    amount: subscription.amount,
    billingCycle: subscription.billingCycle,
    status: subscription.status,
    autoRenew: subscription.autoRenew,
    startedAt: subscription.startedAt,
    expiresAt: subscription.expiresAt,
    cancelledAt: subscription.cancelledAt,
    createdAt: subscription.createdAt,
  };
}

module.exports = {
  savePendingAction,
  getPendingAction,
  clearPendingAction,
  saveDepositContext,
  getDepositContext,
  clearDepositContext,
  dispatchOtpToUser,
  resolvePlanPrice,
  computeAmount,
  computeExpiryDate,
  serializeSubscription,
};