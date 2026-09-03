const { getPrismaClient } = require("../../../config/prisma");
const { ValidationError } = require("../../../common/errors");

const prisma = getPrismaClient();
const GLOBAL_ID = "global";

async function getDeliveryPerKmRate() {
  const config = await prisma.deliveryRateConfig.findUnique({
    where: { id: GLOBAL_ID },
  });
  return config ? Number(config.perKmRate) : null;
}

function isValidPerKmRate(rate) {
  const num = Number(rate);
  return Number.isFinite(num) && num > 0;
}

function assertValidDeliveryRateInput({ perKmRate }) {
  if (!isValidPerKmRate(perKmRate)) {
    throw new ValidationError("Tarif par km invalide.");
  }
}

module.exports = {
  getDeliveryPerKmRate,
  assertValidDeliveryRateInput,
};
