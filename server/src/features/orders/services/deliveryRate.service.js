const { getPrismaClient } = require("../../../config/prisma");
const { assertValidDeliveryRateInput } = require("../utils/deliveryRate.utils");

const prisma = getPrismaClient();
const GLOBAL_ID = "global";

async function getDeliveryRateConfig() {
  return prisma.deliveryRateConfig.findUnique({ where: { id: GLOBAL_ID } });
}

async function upsertDeliveryRateConfig({ perKmRate, updatedBy }) {
  assertValidDeliveryRateInput({ perKmRate });

  return prisma.deliveryRateConfig.upsert({
    where: { id: GLOBAL_ID },
    create: { id: GLOBAL_ID, perKmRate, updatedBy: updatedBy || null },
    update: { perKmRate, updatedBy: updatedBy || null },
  });
}

module.exports = { getDeliveryRateConfig, upsertDeliveryRateConfig };
