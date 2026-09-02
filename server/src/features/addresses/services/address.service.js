const { getPrismaClient } = require("../../../config/prisma");
const { ValidationError, NotFoundError } = require("../../../common/errors");
const { isValidPhone } = require("../../auth/utils/auth");

const prisma = getPrismaClient();

const MAX_ADDRESSES_PER_USER = 20;

function assertValidAddressInput({ address, recipientPhone, latitude, longitude }) {
  if (typeof address !== "string" || !address.trim()) {
    throw new ValidationError("Veuillez entrer une adresse valide.");
  }
  if (recipientPhone && !isValidPhone(recipientPhone)) {
    throw new ValidationError("Veuillez entrer un numéro de téléphone valide.");
  }
  if (latitude !== undefined && latitude !== null && typeof latitude !== "number") {
    throw new ValidationError("Latitude invalide.");
  }
  if (longitude !== undefined && longitude !== null && typeof longitude !== "number") {
    throw new ValidationError("Longitude invalide.");
  }
}

async function listAddresses(userId) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

async function createAddress(userId, body) {
  const {
    label,
    recipientName,
    recipientPhone,
    address,
    city,
    latitude,
    longitude,
    isDefault,
  } = body;

  assertValidAddressInput({ address, recipientPhone, latitude, longitude });

  const count = await prisma.address.count({ where: { userId } });
  if (count >= MAX_ADDRESSES_PER_USER) {
    throw new ValidationError(
      `Vous ne pouvez pas enregistrer plus de ${MAX_ADDRESSES_PER_USER} adresses.`,
    );
  }

  const makeDefault = Boolean(isDefault) || count === 0;

  return prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId,
        label: label?.trim() || null,
        recipientName: recipientName?.trim() || null,
        recipientPhone: recipientPhone?.trim() || null,
        address: address.trim(),
        city: city?.trim() || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        isDefault: makeDefault,
      },
    });
  });
}

async function getOwnedAddress(userId, addressId) {
  const existing = await prisma.address.findUnique({
    where: { id: addressId },
  });
  if (!existing || existing.userId !== userId) {
    throw new NotFoundError("Adresse introuvable.");
  }
  return existing;
}

async function updateAddress(userId, addressId, body) {
  const existing = await getOwnedAddress(userId, addressId);

  const {
    label,
    recipientName,
    recipientPhone,
    address,
    city,
    latitude,
    longitude,
    isDefault,
  } = body;

  if (address !== undefined || recipientPhone !== undefined) {
    assertValidAddressInput({
      address: address ?? existing.address,
      recipientPhone: recipientPhone ?? existing.recipientPhone,
      latitude,
      longitude,
    });
  }

  const data = {};
  if (label !== undefined) data.label = label?.trim() || null;
  if (recipientName !== undefined) data.recipientName = recipientName?.trim() || null;
  if (recipientPhone !== undefined) data.recipientPhone = recipientPhone?.trim() || null;
  if (address !== undefined) data.address = address.trim();
  if (city !== undefined) data.city = city?.trim() || null;
  if (latitude !== undefined) data.latitude = latitude;
  if (longitude !== undefined) data.longitude = longitude;

  const makeDefault = isDefault === true && !existing.isDefault;

  return prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
      data.isDefault = true;
    }

    return tx.address.update({ where: { id: addressId }, data });
  });
}

async function deleteAddress(userId, addressId) {
  const existing = await getOwnedAddress(userId, addressId);

  await prisma.address.delete({ where: { id: addressId } });

  if (existing.isDefault) {
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

  return { id: addressId, removed: true };
}

async function setDefaultAddress(userId, addressId) {
  await getOwnedAddress(userId, addressId);

  return prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
    return tx.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  });
}

module.exports = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
