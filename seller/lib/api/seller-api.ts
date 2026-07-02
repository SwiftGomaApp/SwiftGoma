import { apiClient, type ApiSuccessResponse } from "@/lib/api-client";

// ─── Seller profile ─────────────────────────────────────────────────────────

export interface SellerProfile {
  id: string;
  userId: string;
  shopName: string;
  description: string | null;
  logo: string | null;
  commune: string;
  quartier: string;
  avenue: string | null;
  isApproved: boolean;
  approvedAt: string | null;
  createdAt: string;
}

export interface CreateSellerProfilePayload {
  shopName: string;
  description?: string;
  commune: string;
  quartier: string;
  avenue?: string;
  logo?: File;
}

// ─── KYC ────────────────────────────────────────────────────────────────────

export type KycStatus = "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface KycRequest {
  id: string;
  sellerProfileId: string;
  documents: string[];
  status: KycStatus;
  note: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
}

// ─── Plans ──────────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  tier: "STARTER" | "BUSINESS" | "ENTERPRISE";
  name: string;
  description: string | null;
  isActive: boolean;
  priceCdfMonthly: number;
  priceCdfAnnual: number;
  priceUsdMonthly: number;
  priceUsdAnnual: number;
  maxShops: number;
  maxProducts: number;
  maxImagesPerProduct: number;
  maxVariants: number;
  maxFeaturedProducts: number;
  maxDeliverers: number;
  canFeatureProducts: boolean;
  analyticsRetentionDays: number;
  hasPrioritySupport: boolean;
}

// ─── Subscription ───────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "PENDING_PAYMENT";

export type SubscriptionPaymentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

export interface SubscriptionPayment {
  id: string;
  amount: number;
  currency: "CDF" | "USD";
  provider: "ORANGE" | "AIRTEL" | "MPESA";
  status: SubscriptionPaymentStatus;
  failureReason: string | null;
  createdAt: string;
}

export interface SellerSubscription {
  id: string;
  status: SubscriptionStatus;
  billingCycle: "MONTHLY" | "ANNUAL";
  expiresAt: string | null;
  plan: Plan;
  payments?: SubscriptionPayment[];
}

export interface SubscribePayload {
  tier: "STARTER" | "BUSINESS" | "ENTERPRISE";
  billingCycle: "MONTHLY" | "ANNUAL";
  currency: "CDF" | "USD";
  phoneNumber: string;
  provider: "ORANGE" | "AIRTEL" | "MPESA";
}

export interface SubscribeResponseData {
  subscriptionId: string;
  depositId: string;
  amount: number;
  currency: string;
  provider: string;
  message: string;
}

// ─── Shops ──────────────────────────────────────────────────────────────────

export type ShopStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "CLOSED";

export interface Shop {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: ShopStatus;
  logo: string | null;
  commune: string;
  quartier: string;
  isVerified: boolean;
  totalOrders: number;
  averageRating: number;
  createdAt: string;
}

// ─── Helper: build multipart form-data ─────────────────────────────────────

const toFormData = (payload: Record<string, unknown> | object) => {
  const formData = new FormData();
  Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item as string | Blob));
      return;
    }
    formData.append(key, value as string | Blob);
  });
  return formData;
};

// ─── API ────────────────────────────────────────────────────────────────────

export const sellerApi = {
  // Profile
  getProfile: () =>
    apiClient
      .get<ApiSuccessResponse<SellerProfile | null>>("/sellers/profile")
      .then((res) => res.data),

  createProfile: (payload: CreateSellerProfilePayload) =>
    apiClient
      .post<
        ApiSuccessResponse<SellerProfile>
      >("/sellers/profile", toFormData(payload))
      .then((res) => res.data),

  updateProfile: (payload: Partial<CreateSellerProfilePayload>) =>
    apiClient
      .patch<
        ApiSuccessResponse<SellerProfile>
      >("/sellers/profile", toFormData(payload))
      .then((res) => res.data),

  // KYC
  getKycStatus: () =>
    apiClient
      .get<ApiSuccessResponse<KycRequest | null>>("/sellers/kyc")
      .then((res) => res.data),

  submitKyc: (documents: File[]) => {
    const formData = toFormData({ documents });

    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    return apiClient.post("/sellers/kyc", formData).then((res) => res.data);
  },

  // Plans
  listPlans: () =>
    apiClient
      .get<ApiSuccessResponse<Plan[]>>("/sellers/plans")
      .then((res) => res.data),

  // Subscription
  getSubscription: () =>
    apiClient
      .get<
        ApiSuccessResponse<SellerSubscription | null>
      >("/sellers/subscription")
      .then((res) => res.data),

  subscribe: (payload: SubscribePayload) =>
    apiClient
      .post<
        ApiSuccessResponse<SubscribeResponseData>
      >("/sellers/subscription", payload)
      .then((res) => res.data),

  // Shops
  listMyShops: () =>
    apiClient
      .get<ApiSuccessResponse<Shop[]>>("/sellers/shops")
      .then((res) => res.data),
};
