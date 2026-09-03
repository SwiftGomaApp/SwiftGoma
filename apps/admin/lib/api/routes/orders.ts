import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";

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

export interface AdminOrderSummary {
  id: string;
  status: OrderStatus;
  paymentMethod: string;
  fulfillmentMethod: string;
  currency: string;
  total: string;
  createdAt: string;
  shop: { id: string; name: string; slug: string };
  buyer: { id: string; name: string };
  payment?: { status: string } | null;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  subtotal: string;
  deliveryFee: string;
  deliveryAddress?: string | null;
  cancelReason?: string | null;
  rejectionReason?: string | null;
  failureReason?: string | null;
  items: Array<{
    id: string;
    productName: string;
    variantName: string | null;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  }>;
  payment?: {
    id: string;
    status: string;
    amount: string;
    currency: string;
    provider: string;
    failureReason?: string | null;
  } | null;
}

export interface AdminOrderListResponse {
  items: AdminOrderSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listAdminOrders(params: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
}): Promise<AdminOrderListResponse> {
  const res = await apiClient.get("/orders/admin", { params });
  return unwrap(res);
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail> {
  const res = await apiClient.get(`/orders/admin/${id}`);
  return unwrap(res);
}

export async function cancelAdminOrder(
  id: string,
  reason?: string,
): Promise<AdminOrderDetail> {
  const res = await apiClient.post(`/orders/admin/${id}/cancel`, { reason });
  return unwrap(res);
}

export async function requestAdminOrderRefundApproval(id: string): Promise<{
  pendingId: string;
  message: string;
  expiresInMinutes: number;
  summary: {
    orderId: string;
    amount: number;
    currency: string;
    beneficiary: string;
    phoneNumber: string;
    network: string;
  };
}> {
  const res = await apiClient.post(`/orders/admin/${id}/refund/request-approval`);
  return unwrap(res);
}

export async function confirmAdminOrderRefund(
  id: string,
  input: { pendingId: string; code: string },
): Promise<AdminOrderDetail> {
  const res = await apiClient.post(`/orders/admin/${id}/refund/confirm`, input);
  return unwrap(res);
}

/** @deprecated Utilisez requestAdminOrderRefundApproval + confirmAdminOrderRefund */
export async function refundAdminOrder(id: string): Promise<AdminOrderDetail> {
  const res = await apiClient.post(`/orders/admin/${id}/refund`);
  return unwrap(res);
}

export interface DeliveryRateConfig {
  id: string;
  perKmRate: string;
  updatedBy: string | null;
  updatedAt: string;
}

export async function getDeliveryRateConfig(): Promise<DeliveryRateConfig | null> {
  const res = await apiClient.get("/orders/delivery-rate");
  return unwrap(res);
}

export async function upsertDeliveryRateConfig(
  perKmRate: number,
): Promise<DeliveryRateConfig> {
  const res = await apiClient.put("/orders/delivery-rate", { perKmRate });
  return unwrap(res);
}
