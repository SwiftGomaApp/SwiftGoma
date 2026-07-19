const {
  createSellerProfile,
  getSellerProfile,
  updateSellerProfile,
  suspendSellerProfile,
  reactivateSellerProfile,
} = require("../services/sellerProfile.service");

async function postCreateSellerProfile(req, res, next) {
  try {
    const profile = await createSellerProfile({
      userId: req.user.id,
      businessName: req.body.businessName,
      businessDescription: req.body.businessDescription,
      contactPhone: req.body.contactPhone,
      contactEmail: req.body.contactEmail,
      whatsappNumber: req.body.whatsappNumber,
      address: req.body.address,
      city: req.body.city,
      logoBuffer: req.files?.logo?.[0]?.buffer,
      bannerBuffer: req.files?.banner?.[0]?.buffer,
    });
    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function getMySellerProfile(req, res, next) {
  try {
    const profile = await getSellerProfile(req.user.id);
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function putSellerProfile(req, res, next) {
  try {
    const profile = await updateSellerProfile({
      userId: req.user.id,
      businessName: req.body.businessName,
      businessDescription: req.body.businessDescription,
      contactPhone: req.body.contactPhone,
      contactEmail: req.body.contactEmail,
      whatsappNumber: req.body.whatsappNumber,
      address: req.body.address,
      city: req.body.city,
      logoBuffer: req.files?.logo?.[0]?.buffer,
      bannerBuffer: req.files?.banner?.[0]?.buffer,
    });
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function postSuspendSellerProfile(req, res, next) {
  try {
    const profile = await suspendSellerProfile(
      req.params.userId,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function postReactivateSellerProfile(req, res, next) {
  try {
    const profile = await reactivateSellerProfile(req.params.userId);
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postCreateSellerProfile,
  getMySellerProfile,
  putSellerProfile,
  postSuspendSellerProfile,
  postReactivateSellerProfile,
};
