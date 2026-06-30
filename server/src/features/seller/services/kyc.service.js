const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const notificationService = require("../../notifications/services/notification.service");

// ─── Get KYC status ───────────────────────────────────────────────────────────

const getKycStatus = async ({ userId }) => {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { kycRequest: true },
  });
  if (!profile) throw errors.notFound("Profil vendeur introuvable.");
  if (!profile.kycRequest) throw errors.notFound("Demande KYC introuvable.");
  return profile.kycRequest;
};

// ─── Submit documents ─────────────────────────────────────────────────────────

const submitKyc = async ({ userId, documentUrls }) => {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { kycRequest: true },
  });

  if (!profile) throw errors.notFound("Profil vendeur introuvable.");
  if (!profile.kycRequest) throw errors.notFound("Demande KYC introuvable.");

  if (profile.kycRequest.status === "APPROVED") {
    throw errors.badRequest("Votre KYC est déjà approuvé.");
  }

  if (!documentUrls || documentUrls.length === 0) {
    throw errors.badRequest("Au moins un document est requis.");
  }

  const kyc = await prisma.kycRequest.update({
    where: { sellerProfileId: profile.id },
    data: {
      documents: documentUrls,
      status: "SUBMITTED",
      submittedAt: new Date(),
      note: null,
    },
  });

  // Notify all support users — fire and forget
  prisma.user
    .findMany({
      where: { role: "SUPPORT", isActive: true, isDeleted: false },
      select: { id: true },
    })
    .then((supportUsers) => {
      for (const su of supportUsers) {
        notificationService
          .send({
            userId: su.id,
            type: "KYC",
            title: "Nouveau KYC à examiner",
            body: `Le vendeur "${profile.shopName}" a soumis ses documents KYC.`,
            data: { kycRequestId: kyc.id, sellerProfileId: profile.id },
          })
          .catch(() => {});
      }
    })
    .catch(() => {});

  return kyc;
};

// ─── Support: list pending KYC requests ──────────────────────────────────────

const listPendingKyc = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const where = { status: "SUBMITTED" };

  const [requests, total] = await Promise.all([
    prisma.kycRequest.findMany({
      where,
      orderBy: { submittedAt: "asc" }, // oldest first
      skip,
      take: limit,
      include: {
        sellerProfile: {
          select: {
            id: true,
            shopName: true,
            commune: true,
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    }),
    prisma.kycRequest.count({ where }),
  ]);

  return {
    requests,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Support: approve KYC ─────────────────────────────────────────────────────

const approveKyc = async ({ kycRequestId, supportUserId }) => {
  const kyc = await prisma.kycRequest.findUnique({
    where: { id: kycRequestId },
    include: {
      sellerProfile: {
        select: { id: true, shopName: true, userId: true },
      },
    },
  });

  if (!kyc) throw errors.notFound("Demande KYC introuvable.");
  if (kyc.status === "APPROVED") throw errors.badRequest("KYC déjà approuvé.");

  await prisma.$transaction([
    prisma.kycRequest.update({
      where: { id: kycRequestId },
      data: {
        status: "APPROVED",
        reviewedBy: supportUserId,
        reviewedAt: new Date(),
        note: null,
      },
    }),
    prisma.sellerProfile.update({
      where: { id: kyc.sellerProfileId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: supportUserId,
      },
    }),
  ]);

  notificationService
    .send({
      userId: kyc.sellerProfile.userId,
      type: "KYC",
      title: "KYC approuvé ✅",
      body: "Votre identité a été vérifiée. Vous pouvez maintenant créer vos boutiques.",
      data: { kycRequestId: kyc.id },
    })
    .catch(() => {});

  return kyc;
};

// ─── Support: reject KYC ──────────────────────────────────────────────────────

const rejectKyc = async ({ kycRequestId, supportUserId, reason }) => {
  if (!reason?.trim())
    throw errors.badRequest("La raison du refus est requise.");

  const kyc = await prisma.kycRequest.findUnique({
    where: { id: kycRequestId },
    include: {
      sellerProfile: { select: { userId: true, shopName: true } },
    },
  });

  if (!kyc) throw errors.notFound("Demande KYC introuvable.");

  const updated = await prisma.kycRequest.update({
    where: { id: kycRequestId },
    data: {
      status: "REJECTED",
      reviewedBy: supportUserId,
      reviewedAt: new Date(),
      note: reason.trim(),
    },
  });

  notificationService
    .send({
      userId: kyc.sellerProfile.userId,
      type: "KYC",
      title: "KYC refusé",
      body: `Vos documents ont été refusés : ${reason}. Soumettez à nouveau vos documents.`,
      data: { kycRequestId: kyc.id },
    })
    .catch(() => {});

  return updated;
};

module.exports = {
  getKycStatus,
  submitKyc,
  listPendingKyc,
  approveKyc,
  rejectKyc,
};
