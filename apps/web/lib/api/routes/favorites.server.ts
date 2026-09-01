import "server-only";

import { createServerApiClient } from "@/lib/api/server";
import type { PublicProduct } from "@/lib/api/routes/products";

type ApiEnvelope<T> = { success: boolean; data: T };

export interface FavoritesListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FavoritesListResult {
  products: PublicProduct[];
  pagination: FavoritesListPagination;
}

export async function getMyFavorites(
  params: { page?: number; limit?: number } = {},
): Promise<FavoritesListResult> {
  const client = await createServerApiClient();
  const { data } = await client.get<ApiEnvelope<FavoritesListResult>>(
    "/favorites",
    { params },
  );
  return data.data;
}
