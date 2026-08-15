import { apiClient } from "@/lib/api/client";
import { unwrap, toQueryString, type Paginated } from "@/lib/api/utils";

export type KycStatus =
  | "PENDING"
  | "SUPPORT_REVIEWED"
  | "APPROVED"
  | "REJECTED";

export type IdDocumentType = "NATIONAL_ID" | "PASSPORT" | "DRIVERS_LICENSE";

export interface KycListItem {
  id: string;
  idDocumentType: IdDocumentType;
  status: KycStatus;
  rccmNumber: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  sellerProfile: {
    id: string;
    userId: string;
    businessName: string;
    contactPhone: string;
    contactEmail: string;
    status: string;
  };
}

export interface KycListResponse extends Paginated {
  records: KycListItem[];
}

export interface KycDetail {
  id: string;
  idDocumentType: IdDocumentType;
  idDocumentUrl: string;
  proofOfAddressUrl: string;
  selfieUrl: string;
  rccmNumber: string | null;
  rccmDocumentUrl: string | null;
  status: KycStatus;
  supportReviewedBy: string | null;
  supportReviewedAt: string | null;
  callNotes: string | null;
  adminReviewedBy: string | null;
  adminReviewedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  sellerProfile: {
    id: string;
    businessName: string;
    businessDescription: string;
    contactPhone: string;
    contactEmail: string;
    whatsappNumber: string;
    address: string;
    city: string;
    status: string;
    user: {
      id: string;
      name: string;
      emails: { email: string; isPrimary: boolean; isVerified: boolean }[];
    };
  };
}

export async function listKyc(
  params: {
    page?: number;
    limit?: number;
    status?: KycStatus;
    search?: string;
  } = {},
): Promise<KycListResponse> {
  const res = await apiClient.get(`/seller/kyc${toQueryString(params)}`);
  return unwrap(res);
}

export async function getKyc(id: string): Promise<KycDetail> {
  const res = await apiClient.get(`/seller/kyc/${id}`);
  return unwrap(res);
}

export async function supportReviewKyc(
  id: string,
  callNotes: string,
): Promise<KycDetail> {
  const res = await apiClient.post(`/seller/kyc/${id}/support-review`, {
    callNotes,
  });
  return unwrap(res);
}

export async function approveKyc(id: string): Promise<KycDetail> {
  const res = await apiClient.post(`/seller/kyc/${id}/approve`);
  return unwrap(res);
}

export async function rejectKyc(
  id: string,
  reason: string,
): Promise<KycDetail> {
  const res = await apiClient.post(`/seller/kyc/${id}/reject`, { reason });
  return unwrap(res);
}

export async function suspendSellerProfile(
  userId: string,
  reason?: string,
): Promise<unknown> {
  const res = await apiClient.post(`/seller/${userId}/suspend`, { reason });
  return unwrap(res);
}

export async function reactivateSellerProfile(
  userId: string,
): Promise<unknown> {
  const res = await apiClient.post(`/seller/${userId}/reactivate`);
  return unwrap(res);
}

export type ShopStatus = "DRAFT" | "PUBLISHED" | "SUSPENDED";

export interface ShopListItem {
  id: string;
  sellerProfileId: string;
  name: string;
  slug: string;
  status: ShopStatus;
  suspendedBy: string | null;
  suspensionReason: string | null;
  deletedAt: string | null;
  createdAt: string;
  publishedAt: string | null;
  sellerProfile: { id: string; businessName: string };
  _count: { products: number };
}

export interface ShopListResponse extends Paginated {
  shops: ShopListItem[];
}

export async function listShopsAdmin(
  params: {
    page?: number;
    limit?: number;
    status?: ShopStatus;
    search?: string;
  } = {},
): Promise<ShopListResponse> {
  const res = await apiClient.get(
    `/seller/shops/admin${toQueryString(params)}`,
  );
  return unwrap(res);
}

export async function suspendShop(
  id: string,
  reason?: string,
): Promise<ShopListItem> {
  const res = await apiClient.post(`/seller/shop/${id}/admin/suspend`, {
    reason,
  });
  return unwrap(res);
}

export async function reactivateShop(id: string): Promise<ShopListItem> {
  const res = await apiClient.post(`/seller/shop/${id}/admin/reactivate`);
  return unwrap(res);
}

export async function adminDeleteShop(
  id: string,
  reason?: string,
): Promise<ShopListItem> {
  const res = await apiClient.delete(`/seller/shop/${id}/admin`, {
    data: { reason },
  });
  return unwrap(res);
}

export async function restoreShop(id: string): Promise<ShopListItem> {
  const res = await apiClient.post(`/seller/shop/${id}/restore`);
  return unwrap(res);
}
