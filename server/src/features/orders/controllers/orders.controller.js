const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const orderService = require("../services/order.service");

const placeOrder = catchAsync(async (req, res) => {
  const {
    shopId,
    items,
    paymentMethod,
    phoneNumber,
    provider,
    deliveryAddress,
    deliveryFee,
    currency,
    note,
  } = req.body;

  if (!shopId)
    throw errors.badRequest("L'identifiant de la boutique est requis.");
  if (!paymentMethod)
    throw errors.badRequest("Le mode de paiement est requis.");
  if (!deliveryAddress)
    throw errors.badRequest("L'adresse de livraison est requise.");

  const order = await orderService.placeOrder({
    buyerId: req.user.id,
    shopId,
    items,
    paymentMethod: paymentMethod.toUpperCase(),
    phoneNumber: phoneNumber ?? null,
    provider: provider?.toUpperCase() ?? null,
    deliveryAddress,
    deliveryFee: deliveryFee ?? 0,
    currency: currency?.toUpperCase() ?? "CDF",
    note,
  });

  res.status(201).json({
    success: true,
    message:
      paymentMethod.toUpperCase() === "MOBILE_MONEY"
        ? `Commande créée. Confirmez le paiement sur votre téléphone.`
        : `Commande créée. Le vendeur va la confirmer sous peu.`,
    data: order,
  });
});

const listMyOrders = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await orderService.listBuyerOrders({
    buyerId: req.user.id,
    status: status ?? undefined,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });
  res.status(200).json({ success: true, data: result });
});

const getMyOrder = catchAsync(async (req, res) => {
  const order = await orderService.getOrder({
    orderId: req.params.id,
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: order });
});

const confirmReception = catchAsync(async (req, res) => {
  const order = await orderService.buyerConfirmReception({
    buyerId: req.user.id,
    orderId: req.params.id,
  });
  res.status(200).json({
    success: true,
    message: "Réception confirmée. Merci pour votre commande !",
    data: order,
  });
});

const buyerCancelOrder = catchAsync(async (req, res) => {
  const { reason } = req.body;
  await orderService.cancelOrder({
    userId: req.user.id,
    orderId: req.params.id,
    reason,
    cancelledBy: "buyer",
  });
  res.status(200).json({ success: true, message: "Commande annulée." });
});

const listShopOrders = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await orderService.listSellerOrders({
    shopId: req.params.shopId,
    status: status ?? undefined,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });
  res.status(200).json({ success: true, data: result });
});

const getShopOrder = catchAsync(async (req, res) => {
  const order = await orderService.getOrder({
    orderId: req.params.id,
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: order });
});

const confirmOrder = catchAsync(async (req, res) => {
  const order = await orderService.sellerConfirmOrder({
    shopId: req.params.shopId,
    orderId: req.params.id,
    sellerUserId: req.user.id,
  });
  res.status(200).json({
    success: true,
    message: "Commande confirmée.",
    data: order,
  });
});

const markPreparing = catchAsync(async (req, res) => {
  const order = await orderService.sellerMarkPreparing({
    shopId: req.params.shopId,
    orderId: req.params.id,
    sellerUserId: req.user.id,
  });
  res.status(200).json({
    success: true,
    message: "Commande en préparation.",
    data: order,
  });
});

const markShipped = catchAsync(async (req, res) => {
  const { delivererId } = req.body;
  if (!delivererId)
    throw errors.badRequest("L'identifiant du livreur est requis.");

  const order = await orderService.sellerMarkShipped({
    shopId: req.params.shopId,
    orderId: req.params.id,
    sellerUserId: req.user.id,
    delivererId,
  });
  res.status(200).json({
    success: true,
    message: "Commande expédiée. Le livreur a été notifié.",
    data: order,
  });
});

const sellerCancelOrder = catchAsync(async (req, res) => {
  const { reason } = req.body;
  await orderService.cancelOrder({
    userId: req.user.id,
    orderId: req.params.id,
    reason,
    cancelledBy: "seller",
  });
  res.status(200).json({ success: true, message: "Commande annulée." });
});

const listMyDeliveries = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;

  const deliverer =
    await require("../../../config/db.config").prisma.delivererProfile.findUnique(
      {
        where: { userId: req.user.id },
      },
    );
  if (!deliverer) throw errors.badRequest("Profil livreur introuvable.");

  const result = await orderService.listDelivererOrders({
    delivererId: deliverer.id,
    status: status ?? undefined,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });
  res.status(200).json({ success: true, data: result });
});

const updateLocation = catchAsync(async (req, res) => {
  const { latitude, longitude } = req.body;
  if (latitude == null || longitude == null) {
    throw errors.badRequest("Latitude et longitude requises.");
  }

  const deliverer =
    await require("../../../config/db.config").prisma.delivererProfile.findUnique(
      {
        where: { userId: req.user.id },
      },
    );
  if (!deliverer) throw errors.badRequest("Profil livreur introuvable.");

  await orderService.updateDeliveryLocation({
    delivererId: deliverer.id,
    orderId: req.params.id,
    latitude,
    longitude,
  });

  res.status(200).json({ success: true, message: "Position mise à jour." });
});

const markDelivered = catchAsync(async (req, res) => {
  const deliverer =
    await require("../../../config/db.config").prisma.delivererProfile.findUnique(
      {
        where: { userId: req.user.id },
      },
    );
  if (!deliverer) throw errors.badRequest("Profil livreur introuvable.");

  const order = await orderService.markDelivered({
    delivererId: deliverer.id,
    orderId: req.params.id,
  });
  res.status(200).json({
    success: true,
    message: "Commande marquée comme livrée. L'acheteur a 48h pour confirmer.",
    data: order,
  });
});

module.exports = {
  // Buyer
  placeOrder,
  listMyOrders,
  getMyOrder,
  confirmReception,
  buyerCancelOrder,
  // Seller
  listShopOrders,
  getShopOrder,
  confirmOrder,
  markPreparing,
  markShipped,
  sellerCancelOrder,
  // Deliverer
  listMyDeliveries,
  updateLocation,
  markDelivered,
};
