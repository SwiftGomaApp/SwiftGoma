const { ValidationError } = require("../../../common/errors");
const { WALLET_SETTINGS_CONFIG } = require("../config/walletSettings.config");

function isValidCurrency(currency) {
  return WALLET_SETTINGS_CONFIG.SUPPORTED_CURRENCIES.includes(currency);
}

function isValidMinimumPayoutAmount(amount, currency) {
  if (amount === undefined || amount === null) return true;
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return false;
  const max = WALLET_SETTINGS_CONFIG.MAX_MINIMUM_PAYOUT_AMOUNT[currency];
  return max ? num <= max : true;
}

function resolveMinimumPayoutAmount(minimumPayoutAmount, currency) {
  if (minimumPayoutAmount !== undefined && minimumPayoutAmount !== null) {
    return minimumPayoutAmount;
  }
  return WALLET_SETTINGS_CONFIG.DEFAULT_MINIMUM_PAYOUT_AMOUNT[currency] ?? null;
}

function assertValidWalletSettingsInput(input) {
  const {
    payoutPhoneNumber,
    payoutProvider,
    payoutCountry,
    minimumPayoutAmounts,
  } = input;

  if (!payoutPhoneNumber || typeof payoutPhoneNumber !== "string") {
    throw new ValidationError("Numéro de payout requis.");
  }
  if (!payoutProvider || typeof payoutProvider !== "string") {
    throw new ValidationError("Opérateur mobile money requis.");
  }
  if (!payoutCountry || typeof payoutCountry !== "string") {
    throw new ValidationError("Pays de payout requis.");
  }
  if (minimumPayoutAmounts) {
    for (const entry of minimumPayoutAmounts) {
      if (!isValidCurrency(entry.currency)) {
        throw new ValidationError(`Devise "${entry.currency}" non supportée.`);
      }
      if (!isValidMinimumPayoutAmount(entry.amount, entry.currency)) {
        throw new ValidationError(
          `Montant minimum invalide pour ${entry.currency}.`,
        );
      }
    }
  }
}

module.exports = {
  isValidCurrency,
  isValidMinimumPayoutAmount,
  resolveMinimumPayoutAmount,
  assertValidWalletSettingsInput,
};
