import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";

export interface UserStats {
  total: number;
  byRole: {
    BUYER: number;
    SELLER: number;
    RIDER: number;
    ADMIN: number;
    SUPPORT: number;
  };
  blocked: number;
  active: number;
  deleted: number;
}

export interface SellerProfileStats {
  total: number;
  byStatus: { DRAFT: number; ACTIVE: number; SUSPENDED: number };
}

export interface KycStats {
  total: number;
  byStatus: {
    PENDING: number;
    SUPPORT_REVIEWED: number;
    APPROVED: number;
    REJECTED: number;
  };
  pendingAction: number;
}

export interface PlanStat {
  planId: string;
  name: string;
  slug: string;
  subscriptionCount: number;
}

export type OrderStatus =
  | "AWAITING_PAYMENT"
  | "PENDING_SELLER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "READY_FOR_PICKUP"
  | "RIDER_ASSIGNED"
  | "PICKED_UP"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

export interface OrderStats {
  total: number;
  byStatus: Record<OrderStatus, number>;
  awaitingAction: number;
  gmvByCurrency: { currency: string; total: number; orderCount: number }[];
}

export interface ShopStats {
  total: number;
  byStatus: { DRAFT: number; PUBLISHED: number; SUSPENDED: number };
}

export interface ProductStats {
  total: number;
  byStatus: { DRAFT: number; PUBLISHED: number };
}

export interface AdminOverview {
  users: UserStats;
  sellerProfiles: SellerProfileStats;
  kyc: KycStats;
  plans: PlanStat[];
  orders: OrderStats;
  shops: ShopStats;
  products: ProductStats;
  // Shapes from getSubscriptionStats()/getSubscriptionRevenue()/
  // getInvoiceStats() aren't fully confirmed against source in this
  // session — kept loose rather than typing fields I haven't verified.
  // Narrow these once you're reading real response data.
  subscriptions: unknown;
  revenue: unknown;
  invoices: unknown;
  generatedAt: string;
}

export interface DashboardMetricPoint {
  date: string;
  orders: number;
  gmv: number;
  newUsers: number;
  newSellers: number;
  kycSubmissions: number;
  shopsPublished: number;
}

export interface DashboardMetricsResponse {
  days: number;
  currency: string;
  series: DashboardMetricPoint[];
}

export async function getDashboardMetrics(
  days: 7 | 30 | 90 = 30,
  currency: "USD" | "CDF" = "USD",
): Promise<DashboardMetricsResponse> {
  const res = await apiClient.get("/dashboard/metrics", {
    params: { days, currency },
  });
  return unwrap<DashboardMetricsResponse>(res);
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const res = await apiClient.get("/dashboard/overview");
  return unwrap<AdminOverview>(res);
}
