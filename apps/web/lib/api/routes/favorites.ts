import { api } from "../client";
import type { ProductListParams, ProductListResponse } from "./public";

function unwrap<T>(promise: Promise<{ data: { data: T } }>) {
  return promise.then((res) => res.data.data);
}

export const favoritesApi = {
  // Only page/limit are meaningful here — the wider ProductListParams type
  // is accepted so this can be passed as InfiniteProductGrid's fetchPage prop.
  list(params: Partial<ProductListParams> = {}) {
    const { page, limit } = params;
    return unwrap<ProductListResponse>(
      api.get("/favorites", { params: { page, limit } }),
    );
  },

  listIds() {
    return unwrap<string[]>(api.get("/favorites/ids"));
  },

  add(productId: string) {
    return unwrap<{ id: string; userId: string; productId: string }>(
      api.post(`/favorites/${productId}`),
    );
  },

  remove(productId: string) {
    return unwrap<{ productId: string; removed: boolean }>(
      api.delete(`/favorites/${productId}`),
    );
  },
};
