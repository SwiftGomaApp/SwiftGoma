import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  subcategories: Subcategory[];
}

export async function listCategories(
  includeInactive = true,
): Promise<Category[]> {
  const res = await apiClient.get("/products/categories", {
    params: includeInactive ? { includeInactive: "true" } : undefined,
  });
  return unwrap(res);
}

export async function createCategory(input: {
  name: string;
  sortOrder?: number;
}): Promise<Category> {
  const res = await apiClient.post("/products/categories", input);
  return unwrap(res);
}

export async function updateCategory(
  id: string,
  input: { name?: string; sortOrder?: number; isActive?: boolean },
): Promise<Category> {
  const res = await apiClient.put(`/products/categories/${id}`, input);
  return unwrap(res);
}

export async function createSubcategory(
  categoryId: string,
  input: { name: string; sortOrder?: number },
): Promise<Subcategory> {
  const res = await apiClient.post(
    `/products/categories/${categoryId}/subcategories`,
    input,
  );
  return unwrap(res);
}

export async function updateSubcategory(
  id: string,
  input: { name?: string; sortOrder?: number; isActive?: boolean },
): Promise<Subcategory> {
  const res = await apiClient.put(
    `/products/categories/subcategories/${id}`,
    input,
  );
  return unwrap(res);
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  updatedBy: string | null;
  updatedAt: string;
}

export async function listExchangeRates(): Promise<ExchangeRate[]> {
  const res = await apiClient.get("/products/exchange-rates");
  return unwrap(res);
}

export async function upsertExchangeRate(input: {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}): Promise<ExchangeRate> {
  const res = await apiClient.put("/products/exchange-rates", input);
  return unwrap(res);
}

export async function deleteExchangeRate(
  id: string,
): Promise<{ id: string; deleted: boolean }> {
  const res = await apiClient.delete(`/products/exchange-rates/${id}`);
  return unwrap(res);
}

export async function previewConversion(input: {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}): Promise<{
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  convertedAmount: number;
}> {
  const res = await apiClient.post("/products/exchange-rates/preview", input);
  return unwrap(res);
}
