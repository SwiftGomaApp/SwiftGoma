const { getPrismaClient } = require("../../../config/prisma");
const { ConflictError, ValidationError } = require("../../../common/errors");

const prisma = getPrismaClient();

async function getExchangeRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return 1;

  const direct = await prisma.exchangeRate.findUnique({
    where: { fromCurrency_toCurrency: { fromCurrency, toCurrency } },
  });
  if (direct) return Number(direct.rate);

  const inverse = await prisma.exchangeRate.findUnique({
    where: {
      fromCurrency_toCurrency: {
        fromCurrency: toCurrency,
        toCurrency: fromCurrency,
      },
    },
  });
  if (inverse) return 1 / Number(inverse.rate);

  throw new ConflictError(
    `Aucun taux de change configuré entre ${fromCurrency} et ${toCurrency}.`,
  );
}

async function convertAmount(amount, fromCurrency, toCurrency) {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return Math.round(Number(amount) * rate * 100) / 100;
}

function isValidRate(rate) {
  const num = Number(rate);
  return Number.isFinite(num) && num > 0;
}

function assertValidExchangeRateInput({ fromCurrency, toCurrency, rate }) {
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
    throw new ValidationError("Devises source et cible invalides.");
  }
  if (!isValidRate(rate)) {
    throw new ValidationError("Taux de change invalide.");
  }
}

module.exports = {
  getExchangeRate,
  convertAmount,
  assertValidExchangeRateInput,
};
