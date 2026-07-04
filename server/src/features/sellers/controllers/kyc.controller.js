"use strict";

const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const kycService = require("../services/kyc.service");


const submitKyc = catchAsync(async (req, res) => {
  const {
    sellerType,
    idType,
    idNumber,
    businessName,
    businessRegistrationNumber,
  } = req.body;

  const files = req.files || {};
  const idFrontUrl = files.idFront?.[0]?.path;
  const idBackUrl = files.idBack?.[0]?.path;
  const selfieUrl = files.selfie?.[0]?.path;
  const businessDocUrl = files.businessDoc?.[0]?.path;

  const kyc = await kycService.submitKyc({
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

  res.status(200).json({ success: true, data: kyc });
});

const getMyKycStatus = catchAsync(async (req, res) => {
  const kyc = await kycService.getKycStatus({ userId: req.user.id });
  res.status(200).json({ success: true, data: kyc });
});


const listPendingKyc = catchAsync(async (req, res) => {
  const { country } = req.query;
  const items = await kycService.listPendingKyc({ country });
  res.status(200).json({ success: true, data: items });
});

const reviewKyc = catchAsync(async (req, res) => {
  const { sellerProfileId } = req.params;
  const { approve, note } = req.body;

  if (typeof approve !== "boolean") {
    throw errors.badRequest("Le champ 'approve' (booléen) est requis.");
  }

  const kyc = await kycService.reviewKyc({
    sellerProfileId,
    approve,
    note,
    reviewerId: req.user.id,
  });

  res.status(200).json({ success: true, data: kyc });
});

module.exports = {
  submitKyc,
  getMyKycStatus,
  listPendingKyc,
  reviewKyc,
};
