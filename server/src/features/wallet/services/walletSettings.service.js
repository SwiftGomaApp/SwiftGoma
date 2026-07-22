const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError, ConflictError } = require("../../../common/errors");
const {
  assertValidWalletSettingsInput,
  resolveMinimumPayoutAmount,
} = require("../utils/walletSettings.utils");

const prisma = getPrismaClient();

async function getSellerProfileOrThrow(sellerProfileId) {
  const profile = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
  });
  if (!profile) throw new NotFoundError("Profil vendeur introuvable.");
  return profile;
}

async function createWalletSettings({
  sellerProfileId,
  currency,
  payoutPhoneNumber,
  payoutProvider,
  payoutCountry,
  autoPayoutEnabled = false,
  payoutSchedule = "MANUAL",
  minimumPayoutAmount,
}) {
  await getSellerProfileOrThrow(sellerProfileId);

  const existing = await prisma.walletSettings.findUnique({
    where: { sellerProfileId },
  });
  if (existing) {
    throw new ConflictError(
      "Les paramètres de wallet existent déjà pour ce vendeur. Utilisez la mise à jour à la place.",
    );
  }

  const input = {
    currency,
    payoutPhoneNumber,
    payoutProvider,
    payoutCountry,
    autoPayoutEnabled,
    payoutSchedule,
    minimumPayoutAmount,
  };
  assertValidWalletSettingsInput(input);

  const resolvedMinimum = resolveMinimumPayoutAmount(
    minimumPayoutAmount,
    currency,
  );

  return prisma.walletSettings.create({
    data: {
      sellerProfileId,
      currency,
      payoutPhoneNumber,
      payoutProvider,
      payoutCountry,
      autoPayoutEnabled,
      payoutSchedule,
      minimumPayoutAmount: resolvedMinimum,
    },
  });
}

async function getWalletSettings(sellerProfileId) {
  const settings = await prisma.walletSettings.findUnique({
    where: { sellerProfileId },
  });
  if (!settings) {
    throw new NotFoundError(
      "Aucun paramètre de wallet trouvé pour ce vendeur.",
    );
  }
  return settings;
}

async function updateWalletSettings(sellerProfileId, data) {
  const existing = await getWalletSettings(sellerProfileId);

  const merged = {
    currency: data.currency ?? existing.currency,
    payoutPhoneNumber: data.payoutPhoneNumber ?? existing.payoutPhoneNumber,
    payoutProvider: data.payoutProvider ?? existing.payoutProvider,
    payoutCountry: data.payoutCountry ?? existing.payoutCountry,
    autoPayoutEnabled: data.autoPayoutEnabled ?? existing.autoPayoutEnabled,
    payoutSchedule: data.payoutSchedule ?? existing.payoutSchedule,
    minimumPayoutAmount:
      data.minimumPayoutAmount !== undefined
        ? data.minimumPayoutAmount
        : existing.minimumPayoutAmount,
  };

  assertValidWalletSettingsInput(merged);

  const minimumPayoutAmount =
    data.minimumPayoutAmount !== undefined
      ? data.minimumPayoutAmount
      : data.currency && data.currency !== existing.currency
        ? resolveMinimumPayoutAmount(undefined, merged.currency)
        : merged.minimumPayoutAmount;

  return prisma.walletSettings.update({
    where: { sellerProfileId },
    data: {
      currency: merged.currency,
      payoutPhoneNumber: merged.payoutPhoneNumber,
      payoutProvider: merged.payoutProvider,
      payoutCountry: merged.payoutCountry,
      autoPayoutEnabled: merged.autoPayoutEnabled,
      payoutSchedule: merged.payoutSchedule,
      minimumPayoutAmount,
    },
  });
}

module.exports = {
  createWalletSettings,
  getWalletSettings,
  updateWalletSettings,
};
