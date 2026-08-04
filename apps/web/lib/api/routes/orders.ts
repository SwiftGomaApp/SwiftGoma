import { api } from "../client";

export type OrderStatus =
  | "AWAITING_PAYMENT"
  | "PENDING_SELLER_REVIEW"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "RIDER_ASSIGNED"
  | "PICKED_UP"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

export type OrderPaymentMethod = "CASH_ON_DELIVERY" | "ONLINE_PAYMENT";
export type OrderFulfillmentMethod = "DELIVERY" | "PICKUP";

export type OrderItem = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  unitPrice: string;
  quantity: number;
  subtotal: string;
};

export type Order = {
  id: string;
  buyerId: string;
  shopId: string;
  paymentMethod: OrderPaymentMethod;
  fulfillmentMethod: OrderFulfillmentMethod;
  status: OrderStatus;
  currency: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  deliveryAddress: string | null;
  qrToken: string;
  failureReason?: string | null;
  items: OrderItem[];
  shop?: { id: string; name: string; slug: string };
  createdAt: string;
  updatedAt: string;
};

export type CheckoutInput = {
  shopId: string;
  paymentMethod: OrderPaymentMethod;
  fulfillmentMethod: OrderFulfillmentMethod;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  payerPhoneNumber?: string;
  network?: string;
  countryCode?: string;
  currency?: string;
};

export type CheckoutResult = {
  order: Order;
  payment?: { id: string; status: string };
  payin?: { transaction_id: string };
};

function unwrap<T>(promise: Promise<{ data: { data: T } }>) {
  return promise.then((res) => res.data.data);
}

export const ordersApi = {
  checkout(input: CheckoutInput) {
    return unwrap<CheckoutResult>(api.post("/orders/checkout", input));
  },

  getOrder(orderId: string) {
    return unwrap<Order>(api.get(`/orders/${orderId}`));
  },

  getOrderQr(orderId: string) {
    return unwrap<{ qrCodeDataUrl: string }>(
      api.get(`/orders/${orderId}/qr-code`),
    );
  },

  cancelOrder(orderId: string, reason: string) {
    return unwrap<Order>(api.post(`/orders/${orderId}/cancel`, { reason }));
  },
};
