const { prisma } = require("../../../config/db.config");
const {
  cloudinaryV2: cloudinary,
} = require("../../../config/coudinary.config");
const { errors } = require("../../../shared/errors/app.error");

const publicIdFromUrl = (url) =>
  url.split("/").slice(-2).join("/").split(".")[0];

const destroySafely = (url) => {
  if (!url) return;
  cloudinary.uploader.destroy(publicIdFromUrl(url)).catch(() => {});
};

const submitKyc = async ({
  userId,
  sellerType = "INDIVIDUAL",
  idType,
  idNumber,
  idFrontUrl,
  idBackUrl,
  selfieUrl,
  businessName,
  businessRegistrationNumber,
  businessDocUrl,
}) => {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { kyc: true },
  });
  if (!profile) throw errors.notFound("Profil vendeur introuvable.");

  const country = profile.country;

  const existing = profile.kyc;
  if (existing?.status === "APPROVED") {
    throw errors.badRequest("Votre KYC est déjà approuvé.");
  }
  if (existing?.status === "SUBMITTED") {
    throw errors.badRequest("Votre KYC est déjà en cours de vérification.");
  }

  if (!idType)
    throw errors.badRequest("Le type de document d'identité est requis.");
  if (!idNumber?.trim())
    throw errors.badRequest("Le numéro du document est requis.");
  if (!idFrontUrl)
    throw errors.badRequest("La photo recto du document est requise.");
  if (!selfieUrl) {
    throw errors.badRequest(
      "Une photo de vous tenant votre document est requise.",
    );
  }

  if (idType !== "VOTERS_CARD" && !idBackUrl) {
    throw errors.badRequest("La photo verso du document est requise.");
  }

  if (sellerType === "BUSINESS") {
    if (!businessName?.trim()) {
      throw errors.badRequest("Le nom de l'entreprise est requis.");
    }
    if (!businessRegistrationNumber?.trim()) {
      throw errors.badRequest(
        country === "COD"
          ? "Le numéro RCCM est requis pour un compte entreprise."
          : "Le numéro RDB/TIN est requis pour un compte entreprise.",
      );
    }
    if (!businessDocUrl) {
      throw errors.badRequest(
        "Le document d'enregistrement de l'entreprise est requis.",
      );
    }
  }

  // Clean up the previous batch of uploaded images on a re-submission
  if (existing) {
    [
      existing.idFrontUrl,
      existing.idBackUrl,
      existing.selfieUrl,
      existing.businessDocUrl,
    ].forEach(destroySafely);
  }

  return prisma.kyc.upsert({
    where: { sellerProfileId: profile.id },
    update: {
      sellerType,
      idType,
      idNumber: idNumber.trim(),
      idFrontUrl,
      idBackUrl: idBackUrl ?? null,
      selfieUrl,
      businessName: sellerType === "BUSINESS" ? businessName.trim() : null,
      businessRegistrationNumber:
        sellerType === "BUSINESS" ? businessRegistrationNumber.trim() : null,
      businessDocUrl: sellerType === "BUSINESS" ? businessDocUrl : null,
      status: "SUBMITTED",
      submittedAt: new Date(),
      note: null,
      reviewedBy: null,
      reviewedAt: null,
    },
    create: {
      sellerProfileId: profile.id,
      sellerType,
      idType,
      idNumber: idNumber.trim(),
      idFrontUrl,
      idBackUrl: idBackUrl ?? null,
      selfieUrl,
      businessName: sellerType === "BUSINESS" ? businessName.trim() : null,
      businessRegistrationNumber:
        sellerType === "BUSINESS" ? businessRegistrationNumber.trim() : null,
      businessDocUrl: sellerType === "BUSINESS" ? businessDocUrl : null,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });
};

const getKycStatus = async ({ userId }) => {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    include: { kyc: true },
  });
  if (!profile) throw errors.notFound("Profil vendeur introuvable.");
  if (!profile.kyc) throw errors.notFound("Aucun dossier KYC trouvé.");
  return profile.kyc;
};

/* ── Admin review ─────────────────────────────────────────────────────── */

const listPendingKyc = async ({ country } = {}) => {
  return prisma.kyc.findMany({
    where: {
      status: "SUBMITTED",
      ...(country && { sellerProfile: { country } }),
    },
    include: {
      sellerProfile: {
        select: { shopName: true, userId: true, country: true },
      },
    },
    orderBy: { submittedAt: "asc" },
  });
};

const reviewKyc = async ({ sellerProfileId, approve, note, reviewerId }) => {
  const kyc = await prisma.kyc.findUnique({ where: { sellerProfileId } });
  if (!kyc) throw errors.notFound("Dossier KYC introuvable.");
  if (kyc.status !== "SUBMITTED") {
    throw errors.badRequest("Ce dossier n'est pas en attente de vérification.");
  }

  return prisma.$transaction(async (tx) => {
    const updatedKyc = await tx.kyc.update({
      where: { sellerProfileId },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        note: approve ? null : (note ?? "Document non conforme."),
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    // This is the piece that was missing entirely — nothing previously
    // connected a KYC approval to whether the seller is actually allowed
    // to sell, or advanced them to the next onboarding stage. isApproved
    // defaults to false and only flips here; onboardingStatus moves the
    // seller to PENDING_SUBSCRIPTION on approval (or back to KYC_REJECTED,
    // so they can resubmit) — nothing else in the codebase sets this field.
    await tx.sellerProfile.update({
      where: { id: sellerProfileId },
      data: {
        isApproved: approve,
        approvedAt: approve ? new Date() : null,
        approvedBy: approve ? reviewerId : null,
        onboardingStatus: approve ? "PENDING_SUBSCRIPTION" : "KYC_REJECTED",
      },
    });

    return updatedKyc;
  });
};

module.exports = {
  submitKyc,
  getKycStatus,
  listPendingKyc,
  reviewKyc,
};
