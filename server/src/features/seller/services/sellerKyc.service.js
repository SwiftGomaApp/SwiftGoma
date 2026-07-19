const { getPrismaClient } = require("../../../config/prisma");
const { env } = require("../../../config/env");
const {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} = require("../../../common/errors");
const {
  uploadImage,
  uploadPdf,
  deleteAsset,
} = require("../../../common/services/cloudinaryUpload");
const {
  CLOUDINARY_FOLDERS,
} = require("../../../common/constants/cloudinaryFolders");
const {
  assertValidKycInput,
  assertValidStatusTransition,
  assertResubmittable,
} = require("../utils/sellerKyc.utils");
const {
  sellerKycStatusEmail,
} = require("../../../common/emails/templates/sellerKycStatus");
const {
  createNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");
const MAX_LIMIT = 100;

const prisma = getPrismaClient();

async function uploadKycDocument(file, folder) {
  const isPdf = file.mimetype === "application/pdf";
  const result = isPdf
    ? await uploadPdf(file.buffer, folder)
    : await uploadImage(file.buffer, folder);
  return { ...result, resourceType: isPdf ? "raw" : "image" };
}

const SENSITIVE_USER_FIELDS = [
  "password",
  "phoneVerificationCode",
  "phoneVerificationCodeExpiresAt",
  "loginOtp",
  "loginOtpExpiresAt",
  "passwordResetCode",
  "passwordResetCodeExpiresAt",
  "accountRecoveryCode",
  "accountRecoveryCodeExpiresAt",
];

const EMAIL_SENSITIVE_FIELDS = [
  "verificationCode",
  "verificationCodeExpiresAt",
];

async function getSellerProfileOrThrow(userId) {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError("Profil vendeur introuvable.");
  return profile;
}

function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || 20, 1),
    MAX_LIMIT,
  );
  return { page, limit, skip: (page - 1) * limit };
}

async function submitKyc({
  userId,
  idDocumentType,
  idDocumentFile,
  proofOfAddressFile,
  rccmNumber,
  rccmDocumentFile,
}) {
  const profile = await getSellerProfileOrThrow(userId);

  const existing = await prisma.sellerKyc.findUnique({
    where: { sellerProfileId: profile.id },
  });
  if (existing) {
    throw new ConflictError(
      "Un dossier KYC existe déjà pour ce profil vendeur. Utilisez la resoumission à la place.",
    );
  }

  if (!idDocumentFile || !proofOfAddressFile) {
    throw new ConflictError(
      "La pièce d'identité et la preuve d'adresse sont requises.",
    );
  }
  if (Boolean(rccmNumber) !== Boolean(rccmDocumentFile)) {
    throw new ConflictError(
      "Le numéro RCCM et le document RCCM doivent être fournis ensemble, ou ni l'un ni l'autre.",
    );
  }

  const uploads = [
    uploadKycDocument(idDocumentFile, CLOUDINARY_FOLDERS.SELLER_KYC_ID),
    uploadKycDocument(
      proofOfAddressFile,
      CLOUDINARY_FOLDERS.SELLER_KYC_ADDRESS,
    ),
  ];
  if (rccmDocumentFile) {
    uploads.push(
      uploadKycDocument(rccmDocumentFile, CLOUDINARY_FOLDERS.SELLER_KYC_RCCM),
    );
  }

  const [idDoc, addressDoc, rccmDoc] = await Promise.all(uploads);

  const input = {
    idDocumentType,
    idDocumentUrl: idDoc.url,
    proofOfAddressUrl: addressDoc.url,
    rccmNumber: rccmNumber || undefined,
    rccmDocumentUrl: rccmDoc ? rccmDoc.url : undefined,
  };

  try {
    assertValidKycInput(input);
  } catch (err) {
    const rollback = [
      deleteAsset(idDoc.publicId, idDoc.resourceType),
      deleteAsset(addressDoc.publicId, addressDoc.resourceType),
    ];
    if (rccmDoc)
      rollback.push(deleteAsset(rccmDoc.publicId, rccmDoc.resourceType));
    await Promise.all(rollback);
    throw err;
  }

  const kyc = await prisma.sellerKyc.create({
    data: {
      sellerProfileId: profile.id,
      idDocumentType,
      idDocumentUrl: idDoc.url,
      idDocumentPublicId: idDoc.publicId,
      proofOfAddressUrl: addressDoc.url,
      proofOfAddressPublicId: addressDoc.publicId,
      rccmNumber: rccmNumber || null,
      rccmDocumentUrl: rccmDoc ? rccmDoc.url : null,
      rccmDocumentPublicId: rccmDoc ? rccmDoc.publicId : null,
      status: "PENDING",
    },
  });

  try {
    const emailContent = sellerKycStatusEmail({
      name: profile.businessName,
      action: "submitted",
      actionUrl: `${env.appUrl}/seller/onboarding`,
      locale: "fr",
    });

    await createNotification({
      userId,
      type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
      title: emailContent.subject,
      body: "Votre dossier KYC a été soumis et est en attente de vérification.",
      data: { action: "kycSubmitted" },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[seller] Failed to notify kyc-submitted:", err.message);
  }

  return kyc;
}

async function getKycByUserId(userId) {
  const profile = await getSellerProfileOrThrow(userId);
  const kyc = await prisma.sellerKyc.findUnique({
    where: { sellerProfileId: profile.id },
  });
  if (!kyc) throw new NotFoundError("Aucun dossier KYC trouvé.");
  return kyc;
}

async function getKycById(kycId) {
  const kyc = await prisma.sellerKyc.findUnique({
    where: { id: kycId },
    include: {
      sellerProfile: {
        include: { user: { include: { emails: true } } },
      },
    },
  });
  if (!kyc) throw new NotFoundError("Dossier KYC introuvable.");

  const cleanUser = { ...kyc.sellerProfile.user };
  cleanUser.emails = (cleanUser.emails ?? []).map((e) => {
    const cleanEmail = { ...e };
    for (const field of EMAIL_SENSITIVE_FIELDS) delete cleanEmail[field];
    return cleanEmail;
  });
  for (const field of SENSITIVE_USER_FIELDS) delete cleanUser[field];

  return {
    ...kyc,
    sellerProfile: {
      ...kyc.sellerProfile,
      user: cleanUser,
    },
  };
}

async function supportReviewKyc(actor, kycId) {
  const kyc = await getKycById(kycId);
  assertValidStatusTransition(kyc.status, "SUPPORT_REVIEWED");

  const updated = await prisma.sellerKyc.update({
    where: { id: kycId },
    data: {
      status: "SUPPORT_REVIEWED",
      supportReviewedBy: actor.id,
      supportReviewedAt: new Date(),
    },
  });

  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isBlocked: false, deletedAt: null },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          type: NOTIFICATION_TYPES.SUPPORT,
          title: "Dossier KYC prêt pour approbation",
          body: `Le dossier KYC de "${kyc.sellerProfile.businessName}" a été revu par le support et attend votre approbation.`,
          data: { action: "kycAwaitingAdminApproval", kycId: kyc.id },
        }),
      ),
    );
  } catch (err) {
    console.error(
      "[seller] Failed to notify admins of kyc-support-reviewed:",
      err.message,
    );
  }

  return updated;
}

async function adminApproveKyc(actor, kycId) {
  const kyc = await getKycById(kycId);
  assertValidStatusTransition(kyc.status, "APPROVED");

  const updated = await prisma.sellerKyc.update({
    where: { id: kycId },
    data: {
      status: "APPROVED",
      adminReviewedBy: actor.id,
      adminReviewedAt: new Date(),
    },
  });

  const { activateSellerProfile } = require("./sellerProfile.service");
  await activateSellerProfile(kyc.sellerProfile.userId);

  try {
    const emailContent = sellerKycStatusEmail({
      name: kyc.sellerProfile.businessName,
      action: "approved",
      actionUrl: `${env.appUrl}/seller/dashboard`,
      locale: "fr",
    });

    await createNotification({
      userId: kyc.sellerProfile.userId,
      type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
      title: emailContent.subject,
      body: "Votre KYC a été approuvé. Votre profil vendeur est maintenant actif.",
      data: { action: "kycApproved" },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[seller] Failed to notify kyc-approved:", err.message);
  }

  return updated;
}

async function rejectKyc(actor, kycId, reason) {
  const kyc = await getKycById(kycId);
  assertValidStatusTransition(kyc.status, "REJECTED");

  const updated = await prisma.sellerKyc.update({
    where: { id: kycId },
    data: {
      status: "REJECTED",
      rejectedBy: actor.id,
      rejectedAt: new Date(),
      rejectionReason: reason || null,
    },
  });

  try {
    const emailContent = sellerKycStatusEmail({
      name: kyc.sellerProfile.businessName,
      action: "rejected",
      reason,
      actionUrl: `${env.appUrl}/seller/onboarding`,
      locale: "fr",
    });

    await createNotification({
      userId: kyc.sellerProfile.userId,
      type: NOTIFICATION_TYPES.SELLER_ONBOARDING,
      title: emailContent.subject,
      body: reason
        ? `Votre dossier KYC a été rejeté. Raison : ${reason}`
        : "Votre dossier KYC a été rejeté.",
      data: { action: "kycRejected" },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[seller] Failed to notify kyc-rejected:", err.message);
  }

  return updated;
}

async function resubmitKyc({
  userId,
  idDocumentType,
  idDocumentFile,
  proofOfAddressFile,
  rccmNumber,
  rccmDocumentFile,
}) {
  const profile = await getSellerProfileOrThrow(userId);
  const kyc = await prisma.sellerKyc.findUnique({
    where: { sellerProfileId: profile.id },
  });
  if (!kyc) throw new NotFoundError("Aucun dossier KYC trouvé.");
  assertResubmittable(kyc);

  const oldAssets = [
    { publicId: kyc.idDocumentPublicId },
    { publicId: kyc.proofOfAddressPublicId },
  ];
  if (kyc.rccmDocumentPublicId)
    oldAssets.push({ publicId: kyc.rccmDocumentPublicId });

  const uploads = [];
  const data = {
    status: "PENDING",
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
  };

  if (idDocumentFile) {
    uploads.push(
      uploadKycDocument(idDocumentFile, CLOUDINARY_FOLDERS.SELLER_KYC_ID).then(
        (r) => {
          data.idDocumentUrl = r.url;
          data.idDocumentPublicId = r.publicId;
        },
      ),
    );
  }
  if (proofOfAddressFile) {
    uploads.push(
      uploadKycDocument(
        proofOfAddressFile,
        CLOUDINARY_FOLDERS.SELLER_KYC_ADDRESS,
      ).then((r) => {
        data.proofOfAddressUrl = r.url;
        data.proofOfAddressPublicId = r.publicId;
      }),
    );
  }
  if (rccmDocumentFile) {
    uploads.push(
      uploadKycDocument(
        rccmDocumentFile,
        CLOUDINARY_FOLDERS.SELLER_KYC_RCCM,
      ).then((r) => {
        data.rccmDocumentUrl = r.url;
        data.rccmDocumentPublicId = r.publicId;
      }),
    );
  }
  if (idDocumentType) data.idDocumentType = idDocumentType;
  if (rccmNumber !== undefined) data.rccmNumber = rccmNumber || null;

  await Promise.all(uploads);

  const updated = await prisma.sellerKyc.update({
    where: { id: kyc.id },
    data,
  });

  return updated;
}

async function listKyc(query) {
  const { page, limit, skip } = parsePagination(query);
  const { status, search } = query;

  const VALID_STATUSES = [
    "PENDING",
    "SUPPORT_REVIEWED",
    "APPROVED",
    "REJECTED",
  ];
  if (status && !VALID_STATUSES.includes(status)) {
    throw new BadRequestError("Statut de filtre invalide.");
  }

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          sellerProfile: {
            businessName: { contains: search, mode: "insensitive" },
          },
        }
      : {}),
  };

  const [total, records] = await prisma.$transaction([
    prisma.sellerKyc.count({ where }),
    prisma.sellerKyc.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        sellerProfile: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            contactPhone: true,
            contactEmail: true,
            status: true,
          },
        },
      },
    }),
  ]);

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

module.exports = {
  submitKyc,
  getKycByUserId,
  getKycById,
  listKyc,
  supportReviewKyc,
  adminApproveKyc,
  rejectKyc,
  resubmitKyc,
};
