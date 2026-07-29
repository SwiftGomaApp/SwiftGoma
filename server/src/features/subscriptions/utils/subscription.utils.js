const {
  ConflictError,
  ValidationError,
  NotFoundError,
} = require("../../../common/errors");
const { SUBSCRIPTION_CONFIG } = require("../config/subscription.config");

function calculatePeriodEnd(periodStart, billingCycle) {
  const start = new Date(periodStart);
  const end = new Date(start);

  if (billingCycle === "MONTHLY") {
    end.setMonth(end.getMonth() + 1);
  } else if (billingCycle === "YEARLY") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    throw new ValidationError(
      `Cycle de facturation invalide : "${billingCycle}".`,
    );
  }

  return end;
}

function isSubscriptionActive(subscription) {
  return (
    subscription.status === "ACTIVE" &&
    new Date(subscription.currentPeriodEnd) > new Date()
  );
}

function isWithinGracePeriod(subscription) {
  if (subscription.status !== "PAST_DUE") return false;
  const graceEndsAt = new Date(subscription.currentPeriodEnd);
  graceEndsAt.setDate(
    graceEndsAt.getDate() + SUBSCRIPTION_CONFIG.PAST_DUE_GRACE_PERIOD_DAYS,
  );
  return graceEndsAt > new Date();
}

function assertValidStatusTransition(currentStatus, nextStatus) {
  const allowed =
    SUBSCRIPTION_CONFIG.ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ConflictError(
      `Transition de statut de subscription invalide : "${currentStatus}" → "${nextStatus}".`,
    );
  }
}

function resolvePlanPrice(plan, billingCycle, currency) {
  const price = (plan.prices || []).find(
    (p) => p.billingCycle === billingCycle && p.currency === currency,
  );
  if (!price) {
    throw new NotFoundError(
      `Aucun prix trouvé pour le plan "${plan.name}" (${billingCycle}/${currency}).`,
    );
  }
  return price;
}

module.exports = {
  calculatePeriodEnd,
  isSubscriptionActive,
  isWithinGracePeriod,
  assertValidStatusTransition,
  resolvePlanPrice,
};
