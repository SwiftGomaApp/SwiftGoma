const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { validatePhone } = require("../../../shared/utils/validatePhone.utils");
const { createOtp, verifyOtp } = require("../../../shared/utils/otp.utils");
const { sendOtpSms } = require("../../../services/sms.service");

const maskPhone = (phone) => {
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
};

const requestAddPhone = async ({ userId, phone }) => {
  const result = validatePhone(phone);
  if (!result.valid) throw errors.badRequest(result.message);
  const normalizedPhone = result.phone;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (user.phone) {
    throw errors.badRequest(
      "Vous avez déjà un numéro de téléphone. Utilisez la modification.",
    );
  }

  const conflict = await prisma.user.findFirst({
    where: { phone: normalizedPhone },
    select: { id: true },
  });

  if (conflict) {
    throw errors.badRequest("Ce numéro de téléphone est déjà utilisé.");
  }

  const code = await createOtp(userId, "PHONE_VERIFICATION", normalizedPhone);

  await sendOtpSms({ to: normalizedPhone, code });

  return { target: maskPhone(normalizedPhone) };
};

const verifyAddPhone = async ({ userId, phone, code }) => {
  const result = validatePhone(phone);
  if (!result.valid) throw errors.badRequest(result.message);
  const normalizedPhone = result.phone;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (user.phone) {
    throw errors.badRequest(
      "Vous avez déjà un numéro de téléphone. Utilisez la modification.",
    );
  }

  await verifyOtp(userId, "PHONE_VERIFICATION", code);

  await prisma.user.update({
    where: { id: userId },
    data: {
      phone: normalizedPhone,
      isPhoneVerified: true,
    },
  });

  await prisma.otp.deleteMany({
    where: { userId, type: "PHONE_VERIFICATION" },
  });

  return true;
};

const requestUpdatePhone = async ({ userId, newPhone }) => {
  const result = validatePhone(newPhone);
  if (!result.valid) throw errors.badRequest(result.message);
  const normalizedPhone = result.phone;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (!user.phone) {
    throw errors.badRequest(
      "Aucun numéro de téléphone défini. Utilisez l'ajout.",
    );
  }

  if (user.phone === normalizedPhone) {
    throw errors.badRequest(
      "Le nouveau numéro doit être différent de l'actuel.",
    );
  }

  const conflict = await prisma.user.findFirst({
    where: { phone: normalizedPhone },
    select: { id: true },
  });

  if (conflict) {
    throw errors.badRequest("Ce numéro de téléphone est déjà utilisé.");
  }

  const code = await createOtp(userId, "CHANGE_PHONE", normalizedPhone);

  await sendOtpSms({ to: normalizedPhone, code });

  return { target: maskPhone(normalizedPhone) };
};

const verifyUpdatePhone = async ({ userId, newPhone, code }) => {
  const result = validatePhone(newPhone);
  if (!result.valid) throw errors.badRequest(result.message);
  const normalizedPhone = result.phone;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (!user.phone) {
    throw errors.badRequest(
      "Aucun numéro de téléphone défini. Utilisez l'ajout.",
    );
  }

  await verifyOtp(userId, "CHANGE_PHONE", code);

  await prisma.user.update({
    where: { id: userId },
    data: {
      phone: normalizedPhone,
      isPhoneVerified: true,
    },
  });

  await prisma.otp.deleteMany({
    where: { userId, type: "CHANGE_PHONE" },
  });

  return true;
};

module.exports = {
  requestAddPhone,
  verifyAddPhone,
  requestUpdatePhone,
  verifyUpdatePhone,
};
