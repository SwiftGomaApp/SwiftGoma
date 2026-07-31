const {
  submitKyc,
  getKycByUserId,
  getKycById,
  listKyc,
  supportReviewKyc,
  adminApproveKyc,
  rejectKyc,
  resubmitKyc,
} = require("../services/sellerKyc.service");

function extractKycFiles(req) {
  return {
    idDocumentFile: req.files?.idDocument?.[0],
    proofOfAddressFile: req.files?.proofOfAddress?.[0],
    rccmDocumentFile: req.files?.rccmDocument?.[0],
  };
}

async function postSubmitKyc(req, res, next) {
  try {
    const { idDocumentFile, proofOfAddressFile, rccmDocumentFile } =
      extractKycFiles(req);
    const kyc = await submitKyc({
      userId: req.user.id,
      idDocumentType: req.body.idDocumentType,
      idDocumentFile,
      proofOfAddressFile,
      rccmNumber: req.body.rccmNumber,
      rccmDocumentFile,
    });
    res.status(201).json({ success: true, data: kyc });
  } catch (err) {
    next(err);
  }
}

async function getMyKyc(req, res, next) {
  try {
    const kyc = await getKycByUserId(req.user.id);
    res.status(200).json({ success: true, data: kyc });
  } catch (err) {
    next(err);
  }
}

async function postResubmitKyc(req, res, next) {
  try {
    const { idDocumentFile, proofOfAddressFile, rccmDocumentFile } =
      extractKycFiles(req);
    const kyc = await resubmitKyc({
      userId: req.user.id,
      idDocumentType: req.body.idDocumentType,
      idDocumentFile,
      proofOfAddressFile,
      rccmNumber: req.body.rccmNumber,
      rccmDocumentFile,
    });
    res.status(200).json({ success: true, data: kyc });
  } catch (err) {
    next(err);
  }
}

// ADMIN + SUPPORT
async function getKycList(req, res, next) {
  try {
    const result = await listKyc(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getKycDetail(req, res, next) {
  try {
    const kyc = await getKycById(req.params.id);
    res.status(200).json({ success: true, data: kyc });
  } catch (err) {
    next(err);
  }
}

// SUPPORT only
async function postSupportReview(req, res, next) {
  try {
    const kyc = await supportReviewKyc(req.user, req.params.id);
    res.status(200).json({ success: true, data: kyc });
  } catch (err) {
    next(err);
  }
}

// ADMIN only
async function postAdminApprove(req, res, next) {
  try {
    const kyc = await adminApproveKyc(req.user, req.params.id);
    res.status(200).json({ success: true, data: kyc });
  } catch (err) {
    next(err);
  }
}

// ADMIN + SUPPORT (les deux peuvent rejeter, par ta décision plus tôt)
async function postRejectKyc(req, res, next) {
  try {
    const kyc = await rejectKyc(req.user, req.params.id, req.body.reason);
    res.status(200).json({ success: true, data: kyc });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postSubmitKyc,
  getMyKyc,
  postResubmitKyc,
  getKycList,
  getKycDetail,
  postSupportReview,
  postAdminApprove,
  postRejectKyc,
};
