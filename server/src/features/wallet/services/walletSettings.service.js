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
  payoutPhoneNumber,
  payoutProvider,
  payoutCountry,
  autoPayoutEnabled = false,
  payoutSchedule = "MANUAL",
  minimumPayoutAmounts = [], // ex: [{ currency: "USD", amount: 5 }, { currency: "CDF", amount: 10000 }]
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

  const resolvedMinimums = minimumPayoutAmounts.map((entry) => ({
    currency: entry.currency,
    amount: resolveMinimumPayoutAmount(entry.amount, entry.currency),
  }));

  assertValidWalletSettingsInput({
    payoutPhoneNumber,
    payoutProvider,
    payoutCountry,
    autoPayoutEnabled,
    payoutSchedule,
    minimumPayoutAmounts: resolvedMinimums,
  });

  return prisma.walletSettings.create({
    data: {
      sellerProfileId,
      payoutPhoneNumber,
      payoutProvider,
      payoutCountry,
      autoPayoutEnabled,
      payoutSchedule,
      minimumPayoutAmounts: {
        create: resolvedMinimums.map((entry) => ({
          currency: entry.currency,
          amount: entry.amount,
        })),
      },
    },
    include: { minimumPayoutAmounts: true },
  });
}

async function getWalletSettings(sellerProfileId) {
  const settings = await prisma.walletSettings.findUnique({
    where: { sellerProfileId },
    include: { minimumPayoutAmounts: true },
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
    payoutPhoneNumber: data.payoutPhoneNumber ?? existing.payoutPhoneNumber,
    payoutProvider: data.payoutProvider ?? existing.payoutProvider,
    payoutCountry: data.payoutCountry ?? existing.payoutCountry,
    autoPayoutEnabled: data.autoPayoutEnabled ?? existing.autoPayoutEnabled,
    payoutSchedule: data.payoutSchedule ?? existing.payoutSchedule,
  };

  assertValidWalletSettingsInput({
    ...merged,
    minimumPayoutAmounts: data.minimumPayoutAmounts,
  });

  const updateData = {
    payoutPhoneNumber: merged.payoutPhoneNumber,
    payoutProvider: merged.payoutProvider,
    payoutCountry: merged.payoutCountry,
    autoPayoutEnabled: merged.autoPayoutEnabled,
    payoutSchedule: merged.payoutSchedule,
  };

  // Si des seuils sont fournis, on les upsert un par un (par devise)
  if (data.minimumPayoutAmounts) {
    for (const entry of data.minimumPayoutAmounts) {
      await prisma.minimumPayoutAmount.upsert({
        where: {
          walletSettingsId_currency: {
            walletSettingsId: existing.id,
            currency: entry.currency,
          },
        },
        update: { amount: entry.amount },
        create: {
          walletSettingsId: existing.id,
          currency: entry.currency,
          amount: entry.amount,
        },
      });
    }
  }

  return prisma.walletSettings.update({
    where: { sellerProfileId },
    data: updateData,
    include: { minimumPayoutAmounts: true },
  });
}

module.exports = {
  createWalletSettings,
  getWalletSettings,
  updateWalletSettings,
};
