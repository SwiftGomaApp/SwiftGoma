const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");

const VALID_SELLER_TYPES = ["INDIVIDUAL", "BUSINESS"];
const VALID_ID_TYPES = [
  "NATIONAL_ID",
  "VOTERS_CARD",
  "PASSPORT",
  "RESIDENCE_PERMIT",
];
const VALID_REVIEW_ACTIONS = ["APPROVE", "REJECT"];

const submitKyc = async ({
  userId,
  sellerType,
  idType,
  idNumber,
  idFrontUrl,
  idBackUrl,
  selfieUrl,
  businessName = null,
  businessRegistrationNumber = null,
  businessDocUrl = null,
}) => {
  if (!VALID_SELLER_TYPES.includes(sellerType)) {
    throw errors.badRequest(
      `Type de vendeur invalide. Valeurs valides : ${VALID_SELLER_TYPES.join(", ")}.`,
    );
  }
  if (!VALID_ID_TYPES.includes(idType)) {
    throw errors.badRequest(
      `Type de document invalide. Valeurs valides : ${VALID_ID_TYPES.join(", ")}.`,
    );
  }
  if (!idNumber) throw errors.badRequest("Le numéro du document est requis.");
  if (!idFrontUrl)
    throw errors.badRequest("Le recto du document d'identité est requis.");
  if (!idBackUrl)
    throw errors.badRequest("Le verso du document d'identité est requis.");
  if (!selfieUrl)
    throw errors.badRequest("Le selfie avec le document est requis.");

  if (sellerType === "BUSINESS") {
    if (!businessName)
      throw errors.badRequest("Le nom de l'entreprise est requis.");
    if (!businessRegistrationNumber) {
      throw errors.badRequest(
        "Le numéro d'enregistrement de l'entreprise est requis.",
      );
    }
    if (!businessDocUrl) {
      throw errors.badRequest(
        "Le document d'enregistrement de l'entreprise est requis.",
      );
    }
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { kyc: true },
  });

  if (!sellerProfile) {
    throw errors.notFound(
      "Profil vendeur — créez d'abord votre profil vendeur",
    );
  }

  if (sellerProfile.kyc?.status === "APPROVED") {
    throw errors.badRequest("Votre KYC est déjà approuvé.");
  }
  if (sellerProfile.kyc?.status === "SUBMITTED") {
    throw errors.badRequest("Votre KYC est déjà en cours de vérification.");
  }

  const kycData = {
    sellerType,
    idType,
    idNumber,
    idFrontUrl,
    idBackUrl,
    selfieUrl,
    businessName,
    businessRegistrationNumber,
    businessDocUrl,
    status: "SUBMITTED",
    submittedAt: new Date(),
    reviewedBy: null,
    reviewedAt: null,
    note: null,
  };

  const kyc = sellerProfile.kyc
    ? await prisma.kyc.update({
        where: { sellerProfileId: sellerProfile.id },
        data: kycData,
      })
    : await prisma.kyc.create({
        data: { sellerProfileId: sellerProfile.id, ...kycData },
      });

  if (sellerProfile.onboardingStatus === "KYC_REJECTED") {
    await prisma.sellerProfile.update({
      where: { id: sellerProfile.id },
      data: { onboardingStatus: "PENDING_KYC" },
    });
  }

  return kyc;
};

const getKyc = async ({ userId }) => {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { kyc: true },
  });

  if (!sellerProfile) {
    throw errors.notFound(
      "Profil vendeur — créez d'abord votre profil vendeur",
    );
  }
  if (!sellerProfile.kyc) {
    throw errors.notFound("KYC — vous n'avez pas encore soumis de documents");
  }

  return sellerProfile.kyc;
};

const listPendingKyc = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.kyc.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { submittedAt: "asc" },
      skip,
      take: limit,
      include: {
        sellerProfile: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    }),
    prisma.kyc.count({ where: { status: "SUBMITTED" } }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const reviewKyc = async ({ kycId, reviewerId, action, note = null }) => {
  if (!VALID_REVIEW_ACTIONS.includes(action)) {
    throw errors.badRequest(
      `Action invalide. Valeurs valides : ${VALID_REVIEW_ACTIONS.join(", ")}.`,
    );
  }
  if (action === "REJECT" && !note) {
    throw errors.badRequest("Une note est requise pour justifier un rejet.");
  }

  const kyc = await prisma.kyc.findUnique({
    where: { id: kycId },
    include: { sellerProfile: true },
  });

  if (!kyc) throw errors.notFound("Dossier KYC");

  if (kyc.status !== "SUBMITTED") {
    throw errors.badRequest(
      `Ce dossier KYC a déjà été traité (statut actuel : ${kyc.status}).`,
    );
  }

  const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updatedKyc = await prisma.kyc.update({
    where: { id: kycId },
    data: {
      status: newStatus,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      note,
    },
  });

  await prisma.sellerProfile.update({
    where: { id: kyc.sellerProfileId },
    data: {
      onboardingStatus:
        action === "APPROVE" ? "PENDING_SUBSCRIPTION" : "KYC_REJECTED",
    },
  });

  return updatedKyc;
};

module.exports = { submitKyc, getKyc, listPendingKyc, reviewKyc };
