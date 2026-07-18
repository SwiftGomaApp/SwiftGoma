const { ACCOUNT_DELETION_CONFIG } = require("../config/accountDeletion.config");
const { NotFoundError, AppError } = require("../../../common/errors");

/**
 * @param {Date} deletedAt
 * @returns {Date} The exact moment recovery stops being possible.
 */
function getRecoveryDeadline(deletedAt) {
  return new Date(
    new Date(deletedAt).getTime() +
      ACCOUNT_DELETION_CONFIG.RECOVERY_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  );
}

/**
 * Checked live at request time (login attempts, recovery calls) rather
 * than relying on a purge job having already run — a stale "still
 * recoverable" window is a security gap, not just a courtesy.
 *
 * @param {Date|null|undefined} deletedAt
 * @returns {boolean} False for an active (non-deleted) account too —
 *   deletedAt null means "not deleted," which isn't "within a recovery
 *   window," it's a different state entirely.
 */
function isWithinRecoveryGracePeriod(deletedAt) {
  if (!deletedAt) return false;
  return getRecoveryDeadline(deletedAt).getTime() > Date.now();
}

/**
 * Called from every login method, right after the isBlocked check (a
 * blocked account should never be routed toward "you can recover this" —
 * an Admin-imposed restriction takes priority). Does nothing if the
 * account isn't deleted at all.
 *
 * Two outcomes for a deleted account:
 *   - Still within the recovery window: throws a distinct
 *     ACCOUNT_DELETION_PENDING error carrying `recoverableUntil`, which
 *     the frontend uses to redirect to /account/recovery.
 *   - Past the window: throws NotFoundError — identical to the account
 *     never having existed.
 *
 * @param {{ deletedAt: Date|null }} user
 */
function assertAccountNotDeleted(user) {
  if (!user.deletedAt) return;

  if (!isWithinRecoveryGracePeriod(user.deletedAt)) {
    throw new NotFoundError("No account found with this email.");
  }

  throw new AppError(
    "This account has been deleted but can still be recovered.",
    403,
    "ACCOUNT_DELETION_PENDING",
    { recoverableUntil: getRecoveryDeadline(user.deletedAt).toISOString() },
  );
}

module.exports = {
  getRecoveryDeadline,
  isWithinRecoveryGracePeriod,
  assertAccountNotDeleted,
};
