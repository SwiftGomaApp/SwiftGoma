import { apiGet, apiPost } from "@/lib/api/client";
import type { OrderDetail } from "@/lib/orders";

export const MOBILE_MONEY_NETWORKS = [
  "vodacom",
  "airtel",
  "orange",
  "africell",
] as const;

export type MobileMoneyNetwork = (typeof MOBILE_MONEY_NETWORKS)[number];

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

export type OrderPaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "RELEASED"
  | "REFUNDED"
  | "FAILED";

export type CheckoutPayload = {
  shopId: string;
  paymentMethod: "CASH_ON_DELIVERY" | "ONLINE_PAYMENT";
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  payerPhoneNumber?: string;
  network?: MobileMoneyNetwork;
  countryCode?: string;
  currency: string;
};

export type OrderPayment = {
  id: string;
  orderId: string;
  amount: string;
  currency: string;
  provider: string;
  network: string | null;
  status: OrderPaymentStatus;
  failureReason: string | null;
};

export type OrderItem = {
  id: string;
  productName: string;
  variantName: string | null;
  unitPrice: string;
  quantity: number;
  subtotal: string;
};

export type Order = {
  id: string;
  shopId: string;
  status: OrderStatus;
  paymentMethod: "CASH_ON_DELIVERY" | "ONLINE_PAYMENT";
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  currency: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  failureReason: string | null;
  items: OrderItem[];
  payment: OrderPayment | null;
};

export type CheckoutResult = {
  order: Order;
  payment?: OrderPayment;
};

export function checkout(payload: CheckoutPayload) {
  return apiPost<CheckoutResult>("/orders/checkout", payload);
}

export function getOrder(orderId: string) {
  return apiGet<Order>(`/orders/${orderId}`);
}

export type OrderMessageSenderRole = "BUYER" | "SELLER" | "RIDER";

export type OrderMessage = {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: OrderMessageSenderRole;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function getOrderMessages(
  orderId: string,
  params?: { limit?: number; before?: string },
) {
  return apiGet<OrderMessage[]>(`/orders/${orderId}/messages`, { params });
}

export function getOrderDetail(orderId: string) {
  return apiGet<OrderDetail>(`/orders/${orderId}`);
}

export function getOrderQrCode(orderId: string) {
  return apiGet<{ qrCodeDataUrl: string; qrToken: string }>(
    `/orders/${orderId}/qr-code`,
  );
}

export function confirmOrderReceipt(orderId: string) {
  return apiPost<OrderDetail>(`/orders/${orderId}/confirm-receipt`);
}
