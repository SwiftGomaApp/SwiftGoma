const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const pawapay = require("../../seller/services/pawapay.service");
const notificationService = require("../../notifications/services/notification.service");
const { emitToOrder } = require("../../../config/socket.config");
const { issueInvoice } = require("../../invoice/service/invoice.service");
const { generateOrderConfirmationPdf } = require("./order.pdf");
const {
  sendOrderConfirmationEmail,
} = require("../../../services/email.service");
const { cloudinary } = require("../../../config/coudinary.config");

// ─── Sequential order number ──────────────────────────────────────────────────

const generateOrderNumber = async () => {
  const year = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx) => {
    const existing = await tx.orderCounter.findUnique({ where: { year } });
    if (existing) {
      return tx.orderCounter.update({
        where: { year },
        data: { sequence: { increment: 1 } },
      });
    }
    return tx.orderCounter.create({ data: { year, sequence: 1 } });
  });

  return `ORD-${year}-${String(counter.sequence).padStart(4, "0")}`;
};

// ─── Place order ──────────────────────────────────────────────────────────────

const placeOrder = async ({
  buyerId,
  shopId,
  items, // [{ productId, variantId?, quantity }]
  paymentMethod, // MOBILE_MONEY | CASH_ON_DELIVERY
  phoneNumber, // required for MOBILE_MONEY
  provider, // required for MOBILE_MONEY
  deliveryAddress, // { commune, quartier, avenue?, reference? }
  deliveryFee = 0,
  currency = "CDF",
  note,
}) => {
  if (!items || items.length === 0) {
    throw errors.badRequest("La commande doit contenir au moins un produit.");
  }

  // Validate shop
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { sellerProfile: { select: { userId: true } } },
  });
  if (!shop || shop.status !== "ACTIVE") {
    throw errors.notFound("Boutique introuvable ou inactive.");
  }
  if (shop.sellerProfile.userId === buyerId) {
    throw errors.badRequest(
      "Vous ne pouvez pas commander dans votre propre boutique.",
    );
  }

  // Validate and snapshot each item
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity < 1) {
      throw errors.badRequest(
        "Chaque article doit avoir un produit et une quantité valide.",
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { variants: true },
    });

    if (!product || product.shopId !== shopId || product.status !== "ACTIVE") {
      throw errors.badRequest(`Produit introuvable ou indisponible.`);
    }

    let price = product.price;
    let variantName = null;
    let options = null;

    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) throw errors.badRequest(`Variant introuvable.`);
      if (variant.stock < item.quantity) {
        throw errors.badRequest(
          `Stock insuffisant pour le variant "${variant.name}".`,
        );
      }
      price = variant.price ?? product.price;
      variantName = variant.name;
      options = variant.options;
    } else {
      if (product.stock < item.quantity) {
        throw errors.badRequest(`Stock insuffisant pour "${product.name}".`);
      }
    }

    const lineTotal = price * item.quantity;
    subtotal += lineTotal;

    orderItems.push({
      productId: item.productId,
      variantId: item.variantId ?? null,
      name: product.name,
      price,
      priceUsd: product.priceUsd ?? null,
      variantName,
      options,
      quantity: item.quantity,
      total: lineTotal,
    });
  }

  // Validate delivery address
  if (!deliveryAddress?.commune?.trim()) {
    throw errors.badRequest("La commune de livraison est requise.");
  }
  if (!deliveryAddress?.quartier?.trim()) {
    throw errors.badRequest("Le quartier de livraison est requis.");
  }

  if (paymentMethod === "MOBILE_MONEY" && (!phoneNumber || !provider)) {
    throw errors.badRequest(
      "Numéro de téléphone et opérateur requis pour le paiement Mobile Money.",
    );
  }

  const orderNumber = await generateOrderNumber();
  const total = subtotal + deliveryFee;

  // Create order + items in transaction
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        buyerId,
        shopId,
        status: paymentMethod === "CASH_ON_DELIVERY" ? "PENDING" : "PENDING",
        paymentMethod,
        commune: deliveryAddress.commune.trim(),
        quartier: deliveryAddress.quartier.trim(),
        avenue: deliveryAddress.avenue?.trim() ?? null,
        reference: deliveryAddress.reference?.trim() ?? null,
        subtotal,
        deliveryFee,
        total,
        currency,
        note: note?.trim() ?? null,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    // Decrement stock
    for (const item of items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    return created;
  });

  // For Mobile Money — initiate PawaPay deposit
  if (paymentMethod === "MOBILE_MONEY") {
    try {
      const description = `SwiftGoma ${orderNumber}`;
      const deposit = await pawapay.initiateDeposit({
        amount: total,
        currency,
        provider: provider.toUpperCase(),
        phoneNumber,
        description,
      });

      if (deposit.status === "REJECTED") {
        // Rollback stock and delete order
        await prisma.order.delete({ where: { id: order.id } });
        // Restore stock
        for (const item of items) {
          if (item.variantId) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          } else {
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
        throw errors.badRequest(`Paiement refusé. Veuillez réessayer.`);
      }

      await prisma.orderPayment.create({
        data: {
          orderId: order.id,
          pawapayDepositId: deposit.depositId,
          phoneNumber,
          provider: provider.toUpperCase(),
          amount: total,
          currency,
          status: "PENDING",
          metadata: deposit.raw,
        },
      });
    } catch (err) {
      if (err.code) throw err; // re-throw app errors
      throw errors.badRequest(`Erreur de paiement : ${err.message}`);
    }
  }

  // Notify seller
  notificationService
    .send({
      userId: shop.sellerProfile.userId,
      type: "ORDER",
      title: `Nouvelle commande ${orderNumber}`,
      body: `Vous avez reçu une nouvelle commande de ${total} ${currency}. Confirmez-la dès que possible.`,
      data: { orderId: order.id, orderNumber },
    })
    .catch(() => {});

  return order;
};

// ─── Confirm order payment (called by webhook) ────────────────────────────────

const confirmOrderPayment = async ({ pawapayDepositId, paidAt }) => {
  const payment = await prisma.orderPayment.findUnique({
    where: { pawapayDepositId },
    include: {
      order: {
        include: {
          shop: { include: { sellerProfile: { select: { userId: true } } } },
        },
      },
    },
  });

  if (!payment) throw new Error(`Order payment not found: ${pawapayDepositId}`);
  if (payment.status === "COMPLETED") return;

  await prisma.$transaction([
    prisma.orderPayment.update({
      where: { pawapayDepositId },
      data: { status: "COMPLETED", paidAt: paidAt ?? new Date() },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    }),
  ]);

  console.log(`✅ Order payment completed: ${pawapayDepositId}`);

  const sellerUserId = payment.order.shop.sellerProfile.userId;

  // Fetch buyer info for PDF + email
  const buyer = await prisma.user.findUnique({
    where: { id: payment.order.buyerId },
    select: { id: true, name: true, email: true, phone: true },
  });

  const orderWithItems = await prisma.order.findUnique({
    where: { id: payment.orderId },
    include: { items: true },
  });

  // Generate confirmation PDF and send email — fire and forget
  if (buyer?.email) {
    generateOrderConfirmationPdf(orderWithItems, buyer, payment.order.shop)
      .then(async (pdfBuffer) => {
        // Upload to Cloudinary
        const pdfUrl = await new Promise((res, rej) => {
          const stream = cloudinary.v2.uploader.upload_stream(
            {
              folder: "swiftgoma/order-confirmations",
              public_id: payment.order.orderNumber,
              resource_type: "raw",
              type: "upload",
              format: "pdf",
            },
            (err, result) => (err ? rej(err) : res(result.secure_url)),
          );
          stream.end(pdfBuffer);
        });

        return sendOrderConfirmationEmail({
          to: buyer.email,
          name: buyer.name,
          order: orderWithItems,
          shopName: payment.order.shop.name,
          pdfBuffer,
        });
      })
      .catch((err) =>
        console.error("📄 Order confirmation PDF error:", err.message),
      );
  }

  notificationService
    .send({
      userId: payment.order.buyerId,
      type: "PAYMENT",
      title: "Paiement confirmé",
      body: `Votre commande ${payment.order.orderNumber} a été payée et est en cours de traitement.`,
      data: { orderId: payment.orderId },
    })
    .catch(() => {});

  notificationService
    .send({
      userId: sellerUserId,
      type: "ORDER",
      title: `Commande ${payment.order.orderNumber} payée`,
      body: `Le paiement pour la commande ${payment.order.orderNumber} a été confirmé. Préparez la commande.`,
      data: { orderId: payment.orderId },
    })
    .catch(() => {});
};

// ─── Seller: confirm order (cash on delivery) ─────────────────────────────────

const sellerConfirmOrder = async ({ shopId, orderId, sellerUserId }) => {
  const order = await getOrderAndVerifySeller(shopId, orderId, sellerUserId);

  if (order.status !== "PENDING") {
    throw errors.badRequest(
      `Impossible de confirmer une commande avec le statut "${order.status}".`,
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });

  notificationService
    .send({
      userId: order.buyerId,
      type: "ORDER",
      title: "Commande confirmée",
      body: `Votre commande ${order.orderNumber} a été confirmée par le vendeur et est en cours de préparation.`,
      data: { orderId },
    })
    .catch(() => {});

  return updated;
};

// ─── Seller: mark as preparing ────────────────────────────────────────────────

const sellerMarkPreparing = async ({ shopId, orderId, sellerUserId }) => {
  const order = await getOrderAndVerifySeller(shopId, orderId, sellerUserId);

  if (order.status !== "CONFIRMED") {
    throw errors.badRequest(
      `La commande doit être confirmée avant d'être préparée.`,
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "PREPARING", preparingAt: new Date() },
  });

  notificationService
    .send({
      userId: order.buyerId,
      type: "ORDER",
      title: "Commande en préparation",
      body: `Votre commande ${order.orderNumber} est en cours de préparation.`,
      data: { orderId },
    })
    .catch(() => {});

  return updated;
};

// ─── Seller: mark as shipped + assign deliverer ───────────────────────────────

const sellerMarkShipped = async ({
  shopId,
  orderId,
  sellerUserId,
  delivererId,
}) => {
  const order = await getOrderAndVerifySeller(shopId, orderId, sellerUserId);

  if (order.status !== "PREPARING") {
    throw errors.badRequest(
      `La commande doit être en préparation avant l'expédition.`,
    );
  }

  if (!delivererId) {
    throw errors.badRequest("Vous devez assigner un livreur avant d'expédier.");
  }

  // Verify deliverer belongs to this shop
  const sellerProfile = await prisma.sellerProfile.findFirst({
    where: { shops: { some: { id: shopId } } },
  });

  const deliverer = await prisma.delivererProfile.findUnique({
    where: { id: delivererId },
  });

  if (!deliverer || deliverer.sellerProfileId !== sellerProfile?.id) {
    throw errors.badRequest(
      "Livreur introuvable ou non rattaché à cette boutique.",
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "SHIPPED", shippedAt: new Date(), delivererId },
  });

  // Notify buyer
  notificationService
    .send({
      userId: order.buyerId,
      type: "DELIVERY",
      title: "Commande expédiée",
      body: `Votre commande ${order.orderNumber} est en route. Vous pouvez suivre la livraison en temps réel.`,
      data: { orderId },
    })
    .catch(() => {});

  // Notify deliverer
  notificationService
    .send({
      userId: deliverer.userId,
      type: "DELIVERY",
      title: `Nouvelle livraison — ${order.orderNumber}`,
      body: `Vous avez une nouvelle commande à livrer. Collectez le colis et démarrez la livraison.`,
      data: { orderId },
    })
    .catch(() => {});

  return updated;
};

// ─── Deliverer: update live location ─────────────────────────────────────────

const updateDeliveryLocation = async ({
  delivererId,
  orderId,
  latitude,
  longitude,
}) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order || order.delivererId !== delivererId) {
    throw errors.badRequest(
      "Commande introuvable ou non assignée à ce livreur.",
    );
  }

  if (order.status !== "SHIPPED") {
    throw errors.badRequest("La livraison n'est pas en cours.");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      lastLatitude: parseFloat(latitude),
      lastLongitude: parseFloat(longitude),
      lastLocationAt: new Date(),
    },
  });

  // Emit live location to buyer via Socket.io
  emitToOrder(orderId, "delivery:location", {
    orderId,
    latitude: updated.lastLatitude,
    longitude: updated.lastLongitude,
    updatedAt: updated.lastLocationAt,
  });

  return updated;
};

// ─── Deliverer: mark as delivered ─────────────────────────────────────────────

const markDelivered = async ({ delivererId, orderId }) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shop: { include: { sellerProfile: { select: { userId: true } } } },
    },
  });

  if (!order || order.delivererId !== delivererId) {
    throw errors.badRequest(
      "Commande introuvable ou non assignée à ce livreur.",
    );
  }

  if (order.status !== "SHIPPED") {
    throw errors.badRequest("La commande doit être en cours d'expédition.");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });

  // Notify buyer — they have 48h to confirm or report issue
  notificationService
    .send({
      userId: order.buyerId,
      type: "DELIVERY",
      title: "Commande livrée",
      body: `Votre commande ${order.orderNumber} a été livrée. Confirmez la réception dans les 48h.`,
      data: { orderId },
    })
    .catch(() => {});

  // Schedule auto-complete after 48h (handled by cron)
  return updated;
};

// ─── Buyer: confirm reception ─────────────────────────────────────────────────

const buyerConfirmReception = async ({ buyerId, orderId }) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order || order.buyerId !== buyerId) {
    throw errors.notFound("Commande introuvable.");
  }

  if (order.status !== "DELIVERED") {
    throw errors.badRequest("La commande doit être livrée avant confirmation.");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "COMPLETED", completedAt: new Date() },
    include: { items: true },
  });

  // Issue invoice for the buyer
  issueInvoice({
    userId: buyerId,
    type: "ORDER",
    amount: order.total,
    currency: order.currency,
    paidAt: new Date(),
    referenceId: orderId,
    referenceType: "order",
    items: updated.items.map((item) => ({
      description: item.name,
      note: item.variantName ?? null,
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.total,
    })),
  }).catch((err) => console.error("📄 Order invoice error:", err.message));

  // TODO: release funds to seller wallet when wallet feature is built

  const sellerUserId = await prisma.shop
    .findUnique({
      where: { id: order.shopId },
      include: { sellerProfile: { select: { userId: true } } },
    })
    .then((s) => s?.sellerProfile?.userId);

  if (sellerUserId) {
    notificationService
      .send({
        userId: sellerUserId,
        type: "ORDER",
        title: `Commande ${order.orderNumber} complétée`,
        body: `L'acheteur a confirmé la réception. Les fonds seront bientôt versés à votre portefeuille.`,
        data: { orderId },
      })
      .catch(() => {});
  }

  return updated;
};

// ─── Cancel order ─────────────────────────────────────────────────────────────

const cancelOrder = async ({ userId, orderId, reason, cancelledBy }) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw errors.notFound("Commande introuvable.");

  const cancellableStatuses = ["PENDING", "CONFIRMED"];
  if (!cancellableStatuses.includes(order.status)) {
    throw errors.badRequest(
      `Impossible d'annuler une commande avec le statut "${order.status}". La commande est déjà en préparation ou expédiée.`,
    );
  }

  // Restore stock
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy,
        cancelReason: reason?.trim() ?? null,
      },
    });

    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });

  // TODO: if Mobile Money was paid → initiate refund (wallet feature)

  // Notify both parties
  const shop = await prisma.shop.findUnique({
    where: { id: order.shopId },
    include: { sellerProfile: { select: { userId: true } } },
  });

  const notifyUserId =
    cancelledBy === "buyer" ? shop?.sellerProfile?.userId : order.buyerId;

  if (notifyUserId) {
    notificationService
      .send({
        userId: notifyUserId,
        type: "ORDER",
        title: `Commande ${order.orderNumber} annulée`,
        body: `La commande ${order.orderNumber} a été annulée${reason ? ` : ${reason}` : ""}.`,
        data: { orderId },
      })
      .catch(() => {});
  }

  return true;
};

// ─── List orders ──────────────────────────────────────────────────────────────

const listBuyerOrders = async ({ buyerId, status, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const where = { buyerId, ...(status && { status }) };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: { take: 3 },
        shop: { select: { id: true, name: true, slug: true, logo: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const listSellerOrders = async ({ shopId, status, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const where = { shopId, ...(status && { status }) };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: true,
        payment: true,
        deliverer: {
          select: {
            id: true,
            zone: true,
            vehicleType: true,
            user: { select: { name: true, phone: true } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const listDelivererOrders = async ({
  delivererId,
  status,
  page = 1,
  limit = 20,
}) => {
  const skip = (page - 1) * limit;
  const where = { delivererId, ...(status && { status }) };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: true,
        shop: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ─── Get single order ─────────────────────────────────────────────────────────

const getOrder = async ({ orderId, userId }) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payment: true,
      shop: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          phone: true,
          whatsappNumber: true,
        },
      },
      deliverer: {
        select: {
          id: true,
          zone: true,
          vehicleType: true,
          user: { select: { name: true, phone: true } },
        },
      },
    },
  });

  if (!order) throw errors.notFound("Commande introuvable.");

  // Allow buyer, seller, or assigned deliverer to view
  const shop = await prisma.shop.findUnique({
    where: { id: order.shopId },
    include: { sellerProfile: { select: { userId: true } } },
  });

  const isAllowed =
    order.buyerId === userId ||
    shop?.sellerProfile?.userId === userId ||
    (order.delivererId &&
      (await prisma.delivererProfile.findFirst({
        where: { id: order.delivererId, userId },
      })));

  if (!isAllowed) throw errors.notFound("Commande introuvable.");

  return order;
};

// ─── Auto-complete delivered orders after 48h (called by cron) ───────────────

const autoCompleteDeliveredOrders = async () => {
  const deadline = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      deliveredAt: { lt: deadline },
    },
    include: {
      items: true,
      shop: { include: { sellerProfile: { select: { userId: true } } } },
    },
  });

  for (const order of orders) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    // Issue invoice for the buyer
    issueInvoice({
      userId: order.buyerId,
      type: "ORDER",
      amount: order.total,
      currency: order.currency,
      paidAt: new Date(),
      referenceId: order.id,
      referenceType: "order",
      items: order.items.map((item) => ({
        description: item.name,
        note: item.variantName ?? null,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.total,
      })),
    }).catch((err) =>
      console.error("📄 Auto-complete invoice error:", err.message),
    );

    // TODO: release funds to seller wallet

    notificationService
      .send({
        userId: order.shop.sellerProfile.userId,
        type: "ORDER",
        title: `Commande ${order.orderNumber} complétée automatiquement`,
        body: `La commande ${order.orderNumber} a été complétée automatiquement après 48h. Les fonds seront versés à votre portefeuille.`,
        data: { orderId: order.id },
      })
      .catch(() => {});
  }

  console.log(`✅ Auto-completed ${orders.length} delivered orders`);
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const getOrderAndVerifySeller = async (shopId, orderId, sellerUserId) => {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: sellerUserId },
  });

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });

  if (!shop || shop.sellerProfileId !== sellerProfile?.id) {
    throw errors.notFound("Boutique introuvable.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.shopId !== shopId) {
    throw errors.notFound("Commande introuvable.");
  }

  return order;
};

module.exports = {
  placeOrder,
  confirmOrderPayment,
  sellerConfirmOrder,
  sellerMarkPreparing,
  sellerMarkShipped,
  updateDeliveryLocation,
  markDelivered,
  buyerConfirmReception,
  cancelOrder,
  listBuyerOrders,
  listSellerOrders,
  listDelivererOrders,
  getOrder,
  autoCompleteDeliveredOrders,
};
