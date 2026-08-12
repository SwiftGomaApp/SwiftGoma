import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";
import type {
  SubscriptionStats,
  SubscriptionRevenue,
} from "@/lib/api/routes/subscriptions";

export interface InvoiceStats {
  totalDocuments: number;
  byType: {
    INVOICE: number;
    RECEIPT: number;
  };
  byMonth: unknown[];
}

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
  subscriptions: SubscriptionStats;
  revenue: SubscriptionRevenue;
  invoices: InvoiceStats;
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

export interface SupportOverview {
  users: {
    total: number;
    byRole: { BUYER: number; SELLER: number; RIDER: number };
    blocked: number;
  };
  sellerProfiles: SellerProfileStats;
  kyc: KycStats & {
    awaitingSupportReview: number;
    awaitingAdminApproval: number;
  };
  shops: ShopStats;
  products: ProductStats;
  catalog: { categories: number; blogPosts: number };
  contactMessages: { total: number; last7Days: number };
  generatedAt: string;
}

export interface SupportMetricPoint {
  date: string;
  newUsers: number;
  newSellers: number;
  kycSubmissions: number;
  shopsPublished: number;
}

export interface SupportMetricsResponse {
  days: number;
  series: SupportMetricPoint[];
}

export async function getSupportOverview(): Promise<SupportOverview> {
  const res = await apiClient.get("/dashboard/support-overview");
  return unwrap<SupportOverview>(res);
}

export async function getSupportMetrics(
  days: 7 | 30 | 90 = 30,
): Promise<SupportMetricsResponse> {
  const res = await apiClient.get("/dashboard/support-metrics", {
    params: { days },
  });
  return unwrap<SupportMetricsResponse>(res);
}
