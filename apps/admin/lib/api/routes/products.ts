import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";

export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface AdminProductSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: ProductStatus;
  currency: string;
  minPrice: number | null;
  imageUrl: string | null;
  shop: { id: string; name: string; slug: string; status: string };
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductListResponse {
  items: AdminProductSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listAdminProducts(params: {
  page?: number;
  limit?: number;
  status?: ProductStatus;
  search?: string;
}): Promise<AdminProductListResponse> {
  const res = await apiClient.get("/products/admin", { params });
  return unwrap(res);
}

export async function getAdminProduct(id: string): Promise<AdminProductSummary> {
  const res = await apiClient.get(`/products/admin/${id}`);
  return unwrap(res);
}

export async function moderateAdminProduct(
  id: string,
  input: { status: "DRAFT" | "ARCHIVED"; reason?: string },
): Promise<AdminProductSummary> {
  const res = await apiClient.post(`/products/admin/${id}/status`, input);
  return unwrap(res);
}
