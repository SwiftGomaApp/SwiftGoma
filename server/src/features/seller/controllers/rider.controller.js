const {
  createRiderAccount,
  suspendRider,
  reactivateRider,
  deleteRider,
  getRiderDeliveryHistory,
} = require("../services/rider.service");
const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError } = require("../../../common/errors");

async function getSellerProfileIdForUser(userId) {
  const prisma = getPrismaClient();
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new NotFoundError("Profil vendeur introuvable.");
  return profile.id;
}

// -----------------------------
// VENDEUR (authentifié)
// -----------------------------

async function postCreateRider(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const result = await createRiderAccount({
      sellerProfileId,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      locale: req.body.locale,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postSuspendRider(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const rider = await suspendRider(
      req.params.id,
      sellerProfileId,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: rider });
  } catch (err) {
    next(err);
  }
}

async function postReactivateRider(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const rider = await reactivateRider(req.params.id, sellerProfileId);
    res.status(200).json({ success: true, data: rider });
  } catch (err) {
    next(err);
  }
}

async function deleteRiderHandler(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const rider = await deleteRider(req.params.id, sellerProfileId);
    res.status(200).json({ success: true, data: rider });
  } catch (err) {
    next(err);
  }
}

// -----------------------------
// RIDER (authentifié, son propre historique)
// -----------------------------

async function getMyDeliveryHistory(req, res, next) {
  try {
    const prisma = getPrismaClient();
    const rider = await prisma.rider.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });
    if (!rider) throw new NotFoundError("Profil livreur introuvable.");

    const result = await getRiderDeliveryHistory(rider.id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postCreateRider,
  postSuspendRider,
  postReactivateRider,
  deleteRiderHandler,
  getMyDeliveryHistory,
};
