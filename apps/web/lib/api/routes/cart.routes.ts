import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";

export type CartVariant = {
  id: string;
  name: string | null;
  attributes: Record<string, string> | null;
  sku: string | null;
  price: string;
  stock: number;
  isDefault: boolean;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    status: string;
    images: { id: string; url: string; position: number }[];
  };
};

export type CartItem = {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  variant: CartVariant;
  displayPrice: number | null;
  originalPrice: number | null;
  originalCurrency: string | null;
  conversionUnavailable?: boolean;
};

export type ShopCart = {
  id: string | null;
  shopId: string;
  items: CartItem[];
  shop: {
    id: string;
    name: string;
    slug: string;
    deliveryFee: string;
    deliveryFeeCurrency: string;
  } | null;
  cartCurrency: string | null;
  displayDeliveryFee: number | null;
};

export function getMyCarts() {
  return apiGet<ShopCart[]>("/cart");
}

export function getCartForShop(shopId: string, currency?: string) {
  return apiGet<ShopCart>(`/cart/shop/${shopId}`, {
    params: currency ? { currency } : undefined,
  });
}

export function addCartItem(shopId: string, variantId: string, quantity = 1) {
  return apiPost<CartItem>("/cart/items", { shopId, variantId, quantity });
}

export function updateCartItemQuantity(itemId: string, quantity: number) {
  return apiPut<CartItem>(`/cart/items/${itemId}`, { quantity });
}

export function removeCartItem(itemId: string) {
  return apiDelete<{ id: string; deleted: boolean }>(`/cart/items/${itemId}`);
}

export function clearShopCart(shopId: string) {
  return apiPost<{ cleared: boolean }>(`/cart/shop/${shopId}/clear`);
}
