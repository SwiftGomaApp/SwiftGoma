const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");

const VALID_ROLES = ["BUYER", "SELLER", "DELIVERER", "ADMIN"];

const listUsers = async ({
  page = 1,
  limit = 20,
  search,
  role,
  isBlocked,
  isVerified,
}) => {
  const skip = (page - 1) * limit;

  const where = {
    isDeleted: false,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(role && { role }),
    ...(isBlocked !== undefined && { isBlocked }),
    ...(isVerified !== undefined && { isVerified }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isVerified: true,
        isBlocked: true,
        isActive: true,
        createdAt: true,
        sellerProfile: {
          select: { shopName: true, kycStatus: true, isApproved: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getUserById = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
    include: {
      sellerProfile: true,
      delivererProfile: true,
      preferences: true,
      sessions: { orderBy: { lastActiveAt: "desc" }, take: 5 },
      _count: { select: { addresses: true } },
    },
  });

  if (!user) throw errors.accountNotFound();
  return user;
};

const blockUser = async ({ userId, adminId }) => {
  if (userId === adminId) {
    throw errors.badRequest("Vous ne pouvez pas bloquer votre propre compte.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isBlocked: true, role: true },
  });

  if (!user) throw errors.accountNotFound();
  if (user.role === "ADMIN") {
    throw errors.forbidden("Impossible de bloquer un administrateur.");
  }
  if (user.isBlocked) {
    throw errors.badRequest("Cet utilisateur est déjà bloqué.");
  }

  return prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true, isActive: false },
    }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    }),
  ]);
};

const unblockUser = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isBlocked: true },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isBlocked) {
    throw errors.badRequest("Cet utilisateur n'est pas bloqué.");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isBlocked: false, isActive: true },
  });
};

const verifyUser = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isVerified: true },
  });

  if (!user) throw errors.accountNotFound();
  if (user.isVerified) {
    throw errors.badRequest("Cet utilisateur est déjà vérifié.");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  });
};

const changeUserRole = async ({ userId, role, adminId }) => {
  if (userId === adminId) {
    throw errors.badRequest("Vous ne pouvez pas modifier votre propre rôle.");
  }

  if (!VALID_ROLES.includes(role)) {
    throw errors.badRequest(
      `Rôle invalide. Valeurs : ${VALID_ROLES.join(", ")}.`,
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) throw errors.accountNotFound();

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, role: true },
  });
};

const reviewKyc = async ({ sellerProfileId, decision, note, adminId }) => {
  if (!["APPROVED", "REJECTED"].includes(decision)) {
    throw errors.badRequest("Décision invalide. Valeurs : APPROVED, REJECTED.");
  }

  const profile = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
    select: { id: true, kycStatus: true },
  });

  if (!profile) throw errors.badRequest("Profil vendeur introuvable.");

  if (profile.kycStatus !== "SUBMITTED") {
    throw errors.badRequest(
      "Seuls les profils avec KYC soumis peuvent être examinés.",
    );
  }

  const isApproved = decision === "APPROVED";

  return prisma.sellerProfile.update({
    where: { id: sellerProfileId },
    data: {
      kycStatus: decision,
      isApproved,
      kycNote: note?.trim() ?? null,
      approvedAt: isApproved ? new Date() : null,
      approvedBy: isApproved ? adminId : null,
    },
  });
};

module.exports = {
  listUsers,
  getUserById,
  blockUser,
  unblockUser,
  verifyUser,
  changeUserRole,
  reviewKyc,
};
