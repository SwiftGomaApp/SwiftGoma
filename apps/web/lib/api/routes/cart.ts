import { api } from "../client";

export type CartItem = {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  createdAt: string;
  variant: {
    id: string;
    name: string | null;
    attributes: Record<string, string> | null;
    price: string;
    stock: number;
    product: {
      id: string;
      name: string;
      slug: string;
      currency: string;
      status: string;
      images?: { url: string; position: number }[];
    };
  };
  displayPrice: number | null;
  originalPrice: number | null;
  originalCurrency: string | null;
  conversionUnavailable?: boolean;
};

export type Cart = {
  id: string | null;
  shopId: string;
  items: CartItem[];
  cartCurrency: string | null;
  shop: {
    id: string;
    name: string;
    slug: string;
    deliveryFee: string;
    deliveryFeeCurrency: string;
  } | null;
};

function unwrap<T>(promise: Promise<{ data: { data: T } }>) {
  return promise.then((res) => res.data.data);
}

export const cartApi = {
  addItem(input: { shopId: string; variantId: string; quantity: number }) {
    return unwrap<CartItem>(api.post("/cart/items", input));
  },

  updateItemQuantity(itemId: string, quantity: number) {
    return unwrap<CartItem>(api.put(`/cart/items/${itemId}`, { quantity }));
  },

  removeItem(itemId: string) {
    return unwrap<{ id: string; deleted: boolean }>(
      api.delete(`/cart/items/${itemId}`),
    );
  },

  getCartForShop(shopId: string) {
    return unwrap<Cart>(api.get(`/cart/shop/${shopId}`));
  },

  getMyCarts() {
    return unwrap<Cart[]>(api.get("/cart"));
  },

  clearCart(shopId: string) {
    return unwrap<{ cleared: boolean }>(api.post(`/cart/shop/${shopId}/clear`));
  },
};
