import { apiGet, apiPost } from "./api-client";
import type { RiderUser } from "./auth";

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

export type DeliveryListItem = {
  id: string;
  status: OrderStatus;
  currency: string;
  total: string;
  createdAt: string;
  shop: { name: string };
  buyer: { name: string };
};

export type DeliveryDetail = {
  id: string;
  status: OrderStatus;
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  currency: string;
  total: string;
  deliveryAddress: string | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  createdAt: string;
  shop: {
    id: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  buyer: {
    name: string;
    phone: string | null;
  };
  rejectionReason?: string | null;
  cancelReason?: string | null;
  failureReason?: string | null;
};

export async function loginWithPassword(email: string, password: string) {
  return apiPost<
    | { requiresTotp: true; pendingToken: string }
    | { user: RiderUser; accessToken: string; refreshToken: string }
  >("/auth/login/password", { email, password });
}

export function getMyDeliveries() {
  return apiGet<{
    orders: DeliveryListItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>("/orders/rider/me");
}

export function getDelivery(orderId: string) {
  return apiGet<DeliveryDetail>(`/orders/${orderId}`);
}

export function markPickedUp(orderId: string) {
  return apiPost<DeliveryDetail>(`/orders/${orderId}/picked-up`);
}

export function markOnTheWay(orderId: string) {
  return apiPost<DeliveryDetail>(`/orders/${orderId}/on-the-way`);
}

export function completeDelivery(orderId: string, qrToken: string) {
  return apiPost<DeliveryDetail>(`/orders/${orderId}/complete-delivery`, {
    qrToken,
  });
}

export function markFailedDelivery(orderId: string, reason: string) {
  return apiPost<DeliveryDetail>(`/orders/${orderId}/failed-delivery`, {
    reason,
  });
}
