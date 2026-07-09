const { prisma } = require("../../../config/db.config");
const { cloudinary } = require("../../../config/coudinary.config");
const { errors } = require("../../../shared/errors/app.error");
const { createOtp, verifyOtp } = require("../../../shared/utils/otp.utils");
const { sendOtpEmail } = require("../../../services/email.service");
const { sendOtpSms } = require("../../../services/sms.service");

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar: true,
  role: true,
  isVerified: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  secondaryEmail: true,
  isSecondaryEmailVerified: true,
  createdAt: true,
  updatedAt: true,
};

const getProfile = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
    select: {
      ...USER_PUBLIC_SELECT,
      sellerProfile: true,
      delivererProfile: true,
      preferences: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  return user;
};

const updateProfile = async ({ userId, name }) => {
  if (!name || name.trim().length < 2) {
    throw errors.badRequest("Le nom doit contenir au moins 2 caractères.");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() },
    select: USER_PUBLIC_SELECT,
  });
};

const updateAvatar = async ({ userId, fileUrl }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  });

  if (user?.avatar) {
    const oldPublicId = user.avatar
      .split("/")
      .slice(-2)
      .join("/")
      .split(".")[0];
    await cloudinary.uploader.destroy(oldPublicId).catch(() => {});
  }

  return prisma.user.update({
    where: { id: userId },
    data: { avatar: fileUrl },
    select: USER_PUBLIC_SELECT,
  });
};

const deleteAccount = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isDeleted: true },
  });

  if (!user) throw errors.accountNotFound();
  if (user.isDeleted) throw errors.badRequest("Ce compte est déjà supprimé.");

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        // NOTE: when Wallet model exists, freeze it here:
        // e.g. tx.wallet.update({ where: { userId }, data: { isFrozen: true } })
      },
    });

    await tx.session.deleteMany({ where: { userId } });
    await tx.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    await tx.otp.deleteMany({ where: { userId } });
  });

  return true;
};

const requestRecoverAccount = async ({ email }) => {
  const user = await prisma.user.findUnique({
    where: { email: email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isDeleted: true,
      deletedAt: true,
    },
  });

  if (!user) throw errors.accountNotFound();

  if (!user.isDeleted) {
    throw errors.badRequest("Ce compte n'est pas supprimé.");
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (user.deletedAt && user.deletedAt < cutoff) {
    throw errors.badRequest(
      "Le délai de récupération de 30 jours est dépassé. Ce compte ne peut plus être récupéré.",
    );
  }

  const target = user.email || user.phone;
  const code = await createOtp(user.id, "RECOVER_ACCOUNT", target);

  if (user.email) {
    await sendOtpEmail({
      to: user.email,
      name: "Utilisateur",
      code,
      context: "recover-account",
    });
  } else {
    await sendOtpSms({ to: user.phone, code });
  }

  const masked = user.email
    ? `${user.email[0]}***@${user.email.split("@")[1]}`
    : `${user.phone.slice(0, 4)}****${user.phone.slice(-3)}`;

  return {
    type: user.email ? "email" : "phone",
    target: masked,
  };
};

const recoverAccount = async ({ email, code }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isDeleted: true, deletedAt: true },
  });

  if (!user) throw errors.accountNotFound();

  const userId = user.id;

  if (!user.isDeleted) {
    throw errors.badRequest("Ce compte n'est pas supprimé.");
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (user.deletedAt && user.deletedAt < cutoff) {
    throw errors.badRequest(
      "Le délai de récupération de 30 jours est dépassé. Ce compte ne peut plus être récupéré.",
    );
  }

  await verifyOtp(user.id, "RECOVER_ACCOUNT", code);
  await prisma.otp.deleteMany({
    where: { userId, type: "RECOVER_ACCOUNT" },
  });

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        isDeleted: false,
        isActive: true,
        deletedAt: null,
        name: "Utilisateur", // user will re-set their name on first login
        // NOTE: when Wallet exists, unfreeze here:
        // e.g. tx.wallet.update({ where: { userId }, data: { isFrozen: false } })
      },
    });
  });

  return true;
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  deleteAccount,
  requestRecoverAccount,
  recoverAccount,
};
