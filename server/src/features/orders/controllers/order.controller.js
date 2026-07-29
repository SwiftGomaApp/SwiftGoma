const {
  checkout,
  acceptOrder,
  rejectOrder,
  markReadyForPickup,
  completePickupHandoff,
  assignRider,
  markPickedUp,
  markOnTheWay,
  completeDeliveryHandoff,
  markFailedDelivery,
  scanOrderQr,
  getOrderQrCode,
  cancelOrder,
  getOrderById,
  listOrdersForBuyer,
  listOrdersForShop,
  listOrdersForRider,
} = require("../services/order.service");
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

async function postCheckout(req, res, next) {
  try {
    const result = await checkout({
      buyerId: req.user.id,
      shopId: req.body.shopId,
      paymentMethod: req.body.paymentMethod,
      fulfillmentMethod: req.body.fulfillmentMethod,
      deliveryAddress: req.body.deliveryAddress,
      deliveryLatitude: req.body.deliveryLatitude,
      deliveryLongitude: req.body.deliveryLongitude,
      payerPhoneNumber: req.body.payerPhoneNumber,
      network: req.body.network,
      countryCode: req.body.countryCode,
      currency: req.body.currency,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const result = await listOrdersForBuyer(req.user.id, {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postCancelOrder(req, res, next) {
  try {
    const order = await cancelOrder(
      req.params.id,
      req.user.id,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function getOrderQr(req, res, next) {
  try {
    const result = await getOrderQrCode(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postScanQr(req, res, next) {
  try {
    const order = await scanOrderQr(req.user.id, req.body.qrToken);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function postAcceptOrder(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const order = await acceptOrder(req.params.id, sellerProfileId);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function postRejectOrder(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const order = await rejectOrder(
      req.params.id,
      sellerProfileId,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function postMarkReady(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const order = await markReadyForPickup(req.params.id, sellerProfileId);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function postCompletePickup(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const order = await completePickupHandoff(
      req.params.id,
      sellerProfileId,
      req.body.qrToken,
    );
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function postAssignRider(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const order = await assignRider(
      req.params.id,
      sellerProfileId,
      req.body.riderId,
    );
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function getShopOrders(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const result = await listOrdersForShop(req.params.shopId, sellerProfileId, {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postMarkPickedUp(req, res, next) {
  try {
    const order = await markPickedUp(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function postMarkOnTheWay(req, res, next) {
  try {
    const order = await markOnTheWay(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function postCompleteDelivery(req, res, next) {
  try {
    const order = await completeDeliveryHandoff(
      req.params.id,
      req.user.id,
      req.body.qrToken,
    );
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function postMarkFailedDelivery(req, res, next) {
  try {
    const order = await markFailedDelivery(
      req.params.id,
      req.user.id,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function getMyDeliveries(req, res, next) {
  try {
    const result = await listOrdersForRider(req.user.id, {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await getOrderById(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postCheckout,
  getMyOrders,
  postCancelOrder,
  getOrderQr,
  postScanQr,
  postAcceptOrder,
  postRejectOrder,
  postMarkReady,
  postCompletePickup,
  postAssignRider,
  getShopOrders,
  postMarkPickedUp,
  postMarkOnTheWay,
  postCompleteDelivery,
  postMarkFailedDelivery,
  getMyDeliveries,
  getOrder,
};
