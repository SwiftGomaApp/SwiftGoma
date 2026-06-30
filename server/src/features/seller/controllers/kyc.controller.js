const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const kycService = require("../services/kyc.service");

const getKycStatus = catchAsync(async (req, res) => {
  const kyc = await kycService.getKycStatus({ userId: req.user.id });
  res.status(200).json({ success: true, data: kyc });
});

const submitKyc = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw errors.badRequest("Au moins un document est requis.");
  }

  const documentUrls = req.files.map((f) => f.path);

  const kyc = await kycService.submitKyc({ userId: req.user.id, documentUrls });

  res.status(200).json({
    success: true,
    message: "Documents soumis. Votre KYC sera examiné sous 24 à 48 heures.",
    data: kyc,
  });
});

const listPendingKyc = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await kycService.listPendingKyc({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });
  res.status(200).json({ success: true, data: result });
});

const approveKyc = catchAsync(async (req, res) => {
  const kyc = await kycService.approveKyc({
    kycRequestId: req.params.id,
    supportUserId: req.user.id,
  });
  res.status(200).json({
    success: true,
    message: "KYC approuvé. Le vendeur peut maintenant créer ses boutiques.",
    data: kyc,
  });
});

const rejectKyc = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const kyc = await kycService.rejectKyc({
    kycRequestId: req.params.id,
    supportUserId: req.user.id,
    reason,
  });
  res.status(200).json({
    success: true,
    message: "KYC refusé. Le vendeur a été notifié.",
    data: kyc,
  });
});

module.exports = {
  getKycStatus,
  submitKyc,
  listPendingKyc,
  approveKyc,
  rejectKyc,
};
