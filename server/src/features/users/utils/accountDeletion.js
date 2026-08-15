const { ACCOUNT_DELETION_CONFIG } = require("../config/accountDeletion.config");
const { NotFoundError, AppError } = require("../../../common/errors");

function getRecoveryDeadline(deletedAt) {
  return new Date(
    new Date(deletedAt).getTime() +
      ACCOUNT_DELETION_CONFIG.RECOVERY_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  );
}

function isWithinRecoveryGracePeriod(deletedAt) {
  if (!deletedAt) return false;
  return getRecoveryDeadline(deletedAt).getTime() > Date.now();
}

function assertAccountNotDeleted(user) {
  if (!user.deletedAt) return;

  if (!isWithinRecoveryGracePeriod(user.deletedAt)) {
    throw new NotFoundError("Aucun compte trouvé avec cet e-mail.");
  }

  const primaryEmail =
    user.emails?.find((e) => e.isPrimary)?.email ??
    user.emails?.[0]?.email ??
    null;

  throw new AppError(
    "This account has been deleted but can still be recovered.",
    403,
    "ACCOUNT_DELETION_PENDING",
    {
      recoverableUntil: getRecoveryDeadline(user.deletedAt).toISOString(),
      email: primaryEmail,
    },
  );
}

module.exports = {
  getRecoveryDeadline,
  isWithinRecoveryGracePeriod,
  assertAccountNotDeleted,
};
