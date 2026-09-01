import { apiDelete, apiGet, apiPost } from "@/lib/api/client";

export const FAVORITE_ROUTES = {
  list: "/favorites",
  ids: "/favorites/ids",
  toggle: (productId: string) => `/favorites/${productId}`,
} as const;

export function getFavoriteIds() {
  return apiGet<string[]>(FAVORITE_ROUTES.ids);
}

export function addFavorite(productId: string) {
  return apiPost(FAVORITE_ROUTES.toggle(productId));
}

export function removeFavorite(productId: string) {
  return apiDelete(FAVORITE_ROUTES.toggle(productId));
}
