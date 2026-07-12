const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const sellerKycService = require("../services/seller.kyc.service");

const submitKyc = catchAsync(async (req, res) => {
  const {
    sellerType,
    idType,
    idNumber,
    businessName,
    businessRegistrationNumber,
  } = req.body;

  const files = req.files || {};
  const idFrontUrl = files.idFront?.[0]?.path || null;
  const idBackUrl = files.idBack?.[0]?.path || null;
  const selfieUrl = files.selfie?.[0]?.path || null;
  const businessDocUrl = files.businessDoc?.[0]?.path || null;

  if (!sellerType) throw errors.badRequest("Le type de vendeur est requis.");
  if (!idType) throw errors.badRequest("Le type de document est requis.");
  if (!idNumber) throw errors.badRequest("Le numéro du document est requis.");

  const kyc = await sellerKycService.submitKyc({
    userId: req.user.id,
    sellerType,
    idType,
    idNumber,
    idFrontUrl,
    idBackUrl,
    selfieUrl,
    businessName,
    businessRegistrationNumber,
    businessDocUrl,
  });

  res.status(201).json({
    success: true,
    message:
      "Documents KYC soumis. Votre dossier est en cours de vérification.",
    data: { kyc },
  });
});

const getKyc = catchAsync(async (req, res) => {
  const kyc = await sellerKycService.getKyc({ userId: req.user.id });

  res.status(200).json({
    success: true,
    data: { kyc },
  });
});

const listPendingKyc = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);

  const result = await sellerKycService.listPendingKyc({ page, limit });

  res.status(200).json({
    success: true,
    data: result,
  });
});

const reviewKyc = catchAsync(async (req, res) => {
  const { kycId } = req.params;
  const { action, note } = req.body;

  if (!action)
    throw errors.badRequest("L'action est requise (APPROVE ou REJECT).");

  const kyc = await sellerKycService.reviewKyc({
    kycId,
    reviewerId: req.user.id,
    action,
    note,
  });

  res.status(200).json({
    success: true,
    message: action === "APPROVE" ? "KYC approuvé." : "KYC rejeté.",
    data: { kyc },
  });
});

module.exports = { submitKyc, getKyc, listPendingKyc, reviewKyc };