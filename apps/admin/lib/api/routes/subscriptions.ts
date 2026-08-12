import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";

export type SubscriptionStatus =
  | "PENDING_PAYMENT"
  | "ACTIVE"
  | "FAILED_PAYMENT"
  | "PAST_DUE"
  | "EXPIRED"
  | "CANCELED";

export interface SubscriptionStats {
  totalSubscriptions: number;
  byStatus: Record<SubscriptionStatus, number>;
  activeByPlan: {
    planId: string;
    planName: string;
    planSlug: string | null;
    activeCount: number;
  }[];
  revenueByCurrency: {
    currency: string;
    totalCollected: string;
    paymentCount: number;
  }[];
  recentPayments: {
    id: string;
    businessName: string;
    planName: string;
    amount: string;
    currency: string;
    status: string;
    createdAt: string;
  }[];
}

export interface RevenueBucket {
  currency: string;
  total: string;
  paymentCount: number;
}

export interface SubscriptionRevenue {
  allTimeCollected: RevenueBucket[];
  thisMonthCollected: RevenueBucket[];
  last30DaysCollected: RevenueBucket[];
  pendingOrFailed: RevenueBucket[];
  note: string;
}

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const res = await apiClient.get("/subscriptions/stats");
  return unwrap(res);
}

export async function getSubscriptionRevenue(): Promise<SubscriptionRevenue> {
  const res = await apiClient.get("/subscriptions/revenue");
  return unwrap(res);
}

export interface AdminSubscriptionSummary {
  id: string;
  status: SubscriptionStatus;
  billingCycle: string;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  plan: { id: string; name: string; slug: string | null };
  sellerProfile: {
    id: string;
    businessName: string;
    user: { id: string; name: string; email: string };
  };
  _count: { payments: number };
}

export interface AdminSubscriptionDetail extends AdminSubscriptionSummary {
  renewalPhoneNumber: string | null;
  renewalProvider: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan: {
    id: string;
    name: string;
    slug: string | null;
    prices: { billingCycle: string; currency: string; amount: string }[];
  };
  sellerProfile: {
    id: string;
    businessName: string;
    user: { id: string; name: string; email: string; phone: string | null };
  };
  payments: {
    id: string;
    amount: string;
    currency: string;
    status: string;
    provider: string;
    depositId: string | null;
    paidAt: string | null;
    createdAt: string;
    plan: { name: string; slug: string | null };
    invoices: { id: string; type: string; documentNumber: string; pdfUrl: string }[];
  }[];
}

export interface AdminSubscriptionListResponse {
  items: AdminSubscriptionSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listAdminSubscriptions(params: {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus | "";
  search?: string;
} = {}): Promise<AdminSubscriptionListResponse> {
  const res = await apiClient.get("/subscriptions/admin", {
    params: {
      page: params.page,
      limit: params.limit,
      status: params.status || undefined,
      search: params.search?.trim() || undefined,
    },
  });
  return unwrap(res);
}

export async function getAdminSubscription(
  id: string,
): Promise<AdminSubscriptionDetail> {
  const res = await apiClient.get(`/subscriptions/admin/${id}`);
  return unwrap(res);
}
