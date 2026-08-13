const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError, ConflictError } = require("../../../common/errors");
const {
  assertValidExchangeRateInput,
  getExchangeRate,
} = require("../utils/exchangeRate.utils");

const prisma = getPrismaClient();

async function createExchangeRate({
  fromCurrency,
  toCurrency,
  rate,
  updatedBy,
}) {
  assertValidExchangeRateInput({ fromCurrency, toCurrency, rate });

  const existing = await prisma.exchangeRate.findFirst({
    where: {
      OR: [
        { fromCurrency, toCurrency },
        { fromCurrency: toCurrency, toCurrency: fromCurrency },
      ],
    },
  });

  if (existing) {
    throw new ConflictError(
      `Un taux existe déjà entre ${fromCurrency} et ${toCurrency} (${existing.fromCurrency} → ${existing.toCurrency}). Utilisez la mise à jour à la place.`,
    );
  }

  return prisma.exchangeRate.create({
    data: { fromCurrency, toCurrency, rate, updatedBy: updatedBy || null },
  });
}

async function updateExchangeRate(id, { rate, updatedBy }) {
  const existing = await prisma.exchangeRate.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Taux de change introuvable.");

  assertValidExchangeRateInput({
    fromCurrency: existing.fromCurrency,
    toCurrency: existing.toCurrency,
    rate,
  });

  return prisma.exchangeRate.update({
    where: { id },
    data: { rate, updatedBy: updatedBy || existing.updatedBy },
  });
}

async function upsertExchangeRate({
  fromCurrency,
  toCurrency,
  rate,
  updatedBy,
}) {
  assertValidExchangeRateInput({ fromCurrency, toCurrency, rate });

  const existing = await prisma.exchangeRate.findFirst({
    where: {
      OR: [
        { fromCurrency, toCurrency },
        { fromCurrency: toCurrency, toCurrency: fromCurrency },
      ],
    },
  });

  if (!existing) {
    return prisma.exchangeRate.create({
      data: { fromCurrency, toCurrency, rate, updatedBy: updatedBy || null },
    });
  }

  const isSameDirection = existing.fromCurrency === fromCurrency;
  const newRate = isSameDirection ? rate : 1 / Number(rate);

  return prisma.exchangeRate.update({
    where: { id: existing.id },
    data: { rate: newRate, updatedBy: updatedBy || existing.updatedBy },
  });
}

async function getExchangeRateById(id) {
  const rate = await prisma.exchangeRate.findUnique({ where: { id } });
  if (!rate) throw new NotFoundError("Taux de change introuvable.");
  return rate;
}

async function listExchangeRates() {
  return prisma.exchangeRate.findMany({
    orderBy: [{ fromCurrency: "asc" }, { toCurrency: "asc" }],
  });
}

async function deleteExchangeRate(id) {
  const existing = await prisma.exchangeRate.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Taux de change introuvable.");

  await prisma.exchangeRate.delete({ where: { id } });
  return { id, deleted: true };
}

async function previewConversion({ amount, fromCurrency, toCurrency }) {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  const convertedAmount = Math.round(Number(amount) * rate * 100) / 100;
  return {
    amount: Number(amount),
    fromCurrency,
    toCurrency,
    rate,
    convertedAmount,
  };
}

module.exports = {
  createExchangeRate,
  updateExchangeRate,
  upsertExchangeRate,
  getExchangeRateById,
  listExchangeRates,
  deleteExchangeRate,
  previewConversion,
};
