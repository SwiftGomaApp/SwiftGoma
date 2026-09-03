const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError, ConflictError } = require("../../../common/errors");
const {
  assertValidQuantity,
  assertCartNotFull,
} = require("../utils/cart.utils");
const { convertAmount } = require("../../product/utils/exchangeRate.utils");
const { PRODUCT_CONFIG } = require("../../product/config/product.config");
const { calculateDeliveryFee } = require("../utils/order.utils");
const { getDeliveryPerKmRate } = require("../utils/deliveryRate.utils");

const prisma = getPrismaClient();

async function getOrCreateCart(buyerId, shopId) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { sellerProfile: { select: { status: true } } },
  });
  if (
    !shop ||
    shop.deletedAt ||
    shop.status !== "PUBLISHED" ||
    shop.sellerProfile?.status === "SUSPENDED"
  ) {
    throw new NotFoundError("Boutique introuvable.");
  }

  let cart = await prisma.cart.findUnique({
    where: { buyerId_shopId: { buyerId, shopId } },
  });

  if (!cart) {
    cart = await prisma.cart.create({ data: { buyerId, shopId } });
  }

  return cart;
}

async function addItemToCart(buyerId, { shopId, variantId, quantity }) {
  assertValidQuantity(quantity);

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant || variant.product.shopId !== shopId) {
    throw new NotFoundError(
      "Variante de produit introuvable dans cette boutique.",
    );
  }
  if (variant.product.status !== "PUBLISHED") {
    throw new ConflictError("Ce produit n'est plus disponible.");
  }
  if (variant.stock < quantity) {
    throw new ConflictError(
      `Stock insuffisant. Disponible : ${variant.stock}.`,
    );
  }

  const cart = await getOrCreateCart(buyerId, shopId);

  try {
    return await prisma.$transaction(async (tx) => {
      const existingItem = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: cart.id, variantId } },
      });

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        const freshVariant = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { stock: true },
        });
        if (freshVariant.stock < newQuantity) {
          throw new ConflictError(
            `Stock insuffisant pour la quantité totale demandée. Disponible : ${freshVariant.stock}.`,
          );
        }
        assertValidQuantity(newQuantity);

        return tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      }

      const currentItemCount = await tx.cartItem.count({
        where: { cartId: cart.id },
      });
      assertCartNotFull(currentItemCount);

      return tx.cartItem.create({
        data: { cartId: cart.id, variantId, quantity },
      });
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new ConflictError(
        "Cet article vient d'être ajouté au panier. Merci de réessayer.",
      );
    }
    throw err;
  }
}

async function updateCartItemQuantity(buyerId, cartItemId, quantity) {
  assertValidQuantity(quantity);

  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true, variant: true },
  });
  if (!item || item.cart.buyerId !== buyerId) {
    throw new NotFoundError("Article de panier introuvable.");
  }
  if (item.variant.stock < quantity) {
    throw new ConflictError(
      `Stock insuffisant. Disponible : ${item.variant.stock}.`,
    );
  }

  return prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });
}

async function removeCartItem(buyerId, cartItemId) {
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });
  if (!item || item.cart.buyerId !== buyerId) {
    throw new NotFoundError("Article de panier introuvable.");
  }

  await prisma.cartItem.delete({ where: { id: cartItemId } });
  return { id: cartItemId, deleted: true };
}

async function getPreferredCurrency(buyerId) {
  const user = await prisma.user.findUnique({
    where: { id: buyerId },
    select: { preferredCurrency: true },
  });
  return user?.preferredCurrency ?? null;
}

function resolveDisplayCurrency(
  requestedCurrency,
  preferredCurrency,
  fallbackCurrency,
) {
  if (
    requestedCurrency &&
    PRODUCT_CONFIG.SUPPORTED_CURRENCIES.includes(requestedCurrency)
  ) {
    return requestedCurrency;
  }
  if (
    preferredCurrency &&
    PRODUCT_CONFIG.SUPPORTED_CURRENCIES.includes(preferredCurrency)
  ) {
    return preferredCurrency;
  }
  return fallbackCurrency;
}

async function attachDisplayPrices(
  cart,
  displayCurrency,
  deliveryLatitude = null,
  deliveryLongitude = null,
) {
  if (!cart || cart.items.length === 0) {
    return { ...cart, cartCurrency: null, displayDeliveryFee: null, items: [] };
  }

  const cartCurrency = displayCurrency;

  const itemsWithConversion = await Promise.all(
    cart.items.map(async (item) => {
      const itemCurrency = item.variant.product.currency;
      const originalPrice = Number(item.variant.price);

      if (itemCurrency === cartCurrency) {
        return {
          ...item,
          displayPrice: originalPrice,
          originalPrice: null,
          originalCurrency: null,
        };
      }

      try {
        const convertedPrice = await convertAmount(
          originalPrice,
          itemCurrency,
          cartCurrency,
        );
        return {
          ...item,
          displayPrice: convertedPrice,
          originalPrice,
          originalCurrency: itemCurrency,
        };
      } catch (err) {
        console.error(
          `[cart] Conversion échouée (${itemCurrency} -> ${cartCurrency}) pour variant ${item.variantId}:`,
          err.message,
        );
        return {
          ...item,
          displayPrice: null,
          originalPrice,
          originalCurrency: itemCurrency,
          conversionUnavailable: true,
        };
      }
    }),
  );

  let displayDeliveryFee = null;
  if (cart.shop?.deliveryFee != null) {
    const perKmRate = await getDeliveryPerKmRate();
    const rawFee = calculateDeliveryFee(
      cart.shop,
      deliveryLatitude,
      deliveryLongitude,
      perKmRate,
    );
    if (cart.shop.deliveryFeeCurrency === cartCurrency) {
      displayDeliveryFee = rawFee;
    } else {
      try {
        displayDeliveryFee = await convertAmount(
          rawFee,
          cart.shop.deliveryFeeCurrency,
          cartCurrency,
        );
      } catch (err) {
        console.error(
          `[cart] Conversion livraison échouée (${cart.shop.deliveryFeeCurrency} -> ${cartCurrency}):`,
          err.message,
        );
      }
    }
  }

  return {
    ...cart,
    cartCurrency,
    displayDeliveryFee,
    items: itemsWithConversion,
  };
}

async function getCart(
  buyerId,
  shopId,
  requestedCurrency = null,
  deliveryLatitude = null,
  deliveryLongitude = null,
) {
  const cart = await prisma.cart.findUnique({
    where: { buyerId_shopId: { buyerId, shopId } },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  currency: true,
                  status: true,
                  images: { orderBy: { position: "asc" }, take: 1 },
                },
              },
            },
          },
        },
      },
      shop: {
        select: {
          id: true,
          name: true,
          slug: true,
          deliveryFee: true,
          deliveryFeeCurrency: true,
          deliveryFreeKm: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  if (!cart) {
    return {
      id: null,
      shopId,
      items: [],
      shop: null,
      cartCurrency: null,
      displayDeliveryFee: null,
    };
  }

  const preferredCurrency = await getPreferredCurrency(buyerId);
  const firstItemCurrency = cart.items[0]?.variant.product.currency;
  const displayCurrency = resolveDisplayCurrency(
    requestedCurrency,
    preferredCurrency,
    firstItemCurrency,
  );
  return attachDisplayPrices(
    cart,
    displayCurrency,
    deliveryLatitude,
    deliveryLongitude,
  );
}

async function listMyCarts(buyerId) {
  const carts = await prisma.cart.findMany({
    where: { buyerId, items: { some: {} } },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  currency: true,
                  status: true,
                  images: { orderBy: { position: "asc" }, take: 1 },
                },
              },
            },
          },
        },
      },
      shop: {
        select: {
          id: true,
          name: true,
          slug: true,
          deliveryFee: true,
          deliveryFeeCurrency: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (carts.length === 0) return [];

  const preferredCurrency = await getPreferredCurrency(buyerId);
  return Promise.all(
    carts.map((cart) => {
      const firstItemCurrency = cart.items[0]?.variant.product.currency;
      const displayCurrency = resolveDisplayCurrency(
        null,
        preferredCurrency,
        firstItemCurrency,
      );
      return attachDisplayPrices(cart, displayCurrency);
    }),
  );
}

async function clearCart(buyerId, shopId) {
  const cart = await prisma.cart.findUnique({
    where: { buyerId_shopId: { buyerId, shopId } },
  });
  if (!cart) return { cleared: true };

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return { cleared: true };
}

module.exports = {
  getOrCreateCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  getCart,
  listMyCarts,
  clearCart,
};
