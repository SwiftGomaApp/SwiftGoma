const { ValidationError } = require("../../../common/errors");
const { WALLET_SETTINGS_CONFIG } = require("../config/walletSettings.config");

function isValidCurrency(currency) {
  return WALLET_SETTINGS_CONFIG.SUPPORTED_CURRENCIES.includes(currency);
}

function isValidPayoutSchedule(schedule) {
  return WALLET_SETTINGS_CONFIG.PAYOUT_SCHEDULES.includes(schedule);
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
    currency,
    payoutPhoneNumber,
    payoutProvider,
    payoutCountry,
    autoPayoutEnabled,
    payoutSchedule,
    minimumPayoutAmount,
  } = input;

  if (!isValidCurrency(currency)) {
    throw new ValidationError("Devise de payout invalide.");
  }
  if (!payoutPhoneNumber || typeof payoutPhoneNumber !== "string") {
    throw new ValidationError("Numéro de payout requis.");
  }
  if (!payoutProvider || typeof payoutProvider !== "string") {
    throw new ValidationError("Opérateur mobile money requis.");
  }
  if (!payoutCountry || typeof payoutCountry !== "string") {
    throw new ValidationError("Pays de payout requis.");
  }
  if (payoutSchedule !== undefined && !isValidPayoutSchedule(payoutSchedule)) {
    throw new ValidationError("Fréquence de payout invalide.");
  }
  if (autoPayoutEnabled && payoutSchedule === "MANUAL") {
    throw new ValidationError(
      'Un payout automatique ne peut pas avoir une fréquence "manuelle".',
    );
  }
  if (!isValidMinimumPayoutAmount(minimumPayoutAmount, currency)) {
    throw new ValidationError("Montant minimum de payout invalide.");
  }
}

module.exports = {
  isValidCurrency,
  isValidPayoutSchedule,
  isValidMinimumPayoutAmount,
  resolveMinimumPayoutAmount,
  assertValidWalletSettingsInput,
};
