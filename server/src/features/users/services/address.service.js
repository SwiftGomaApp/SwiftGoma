const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");

const MAX_ADDRESSES = 10;

const validateAddressFields = ({ label, commune, quartier, avenue }) => {
  if (!label?.trim()) throw errors.badRequest("Le libellé est requis.");
  if (!commune?.trim()) throw errors.badRequest("La commune est requise.");
  if (!quartier?.trim()) throw errors.badRequest("Le quartier est requis.");
  if (!avenue?.trim()) throw errors.badRequest("L'avenue est requise.");
};

const listAddresses = async ({ userId }) => {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
};

const addAddress = async ({
  userId,
  label,
  commune,
  quartier,
  avenue,
  reference,
  isDefault,
}) => {
  validateAddressFields({ label, commune, quartier, avenue });

  const count = await prisma.address.count({ where: { userId } });
  if (count >= MAX_ADDRESSES) {
    throw errors.badRequest(
      `Vous ne pouvez pas avoir plus de ${MAX_ADDRESSES} adresses.`,
    );
  }

  const shouldBeDefault = isDefault || count === 0;

  return prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId,
        label: label.trim(),
        commune: commune.trim(),
        quartier: quartier.trim(),
        avenue: avenue.trim(),
        reference: reference?.trim() ?? null,
        isDefault: shouldBeDefault,
      },
    });
  });
};

const updateAddress = async ({
  userId,
  addressId,
  label,
  commune,
  quartier,
  avenue,
  reference,
}) => {
  validateAddressFields({ label, commune, quartier, avenue });

  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw errors.badRequest("Adresse introuvable.");
  }

  return prisma.address.update({
    where: { id: addressId },
    data: {
      label: label.trim(),
      commune: commune.trim(),
      quartier: quartier.trim(),
      avenue: avenue.trim(),
      reference: reference?.trim() ?? null,
    },
  });
};

const deleteAddress = async ({ userId, addressId }) => {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw errors.badRequest("Adresse introuvable.");
  }

  await prisma.address.delete({ where: { id: addressId } });

  if (address.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.address.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  return true;
};

const setDefaultAddress = async ({ userId, addressId }) => {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw errors.badRequest("Adresse introuvable.");
  }

  return prisma.$transaction([
    prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);
};

module.exports = {
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
