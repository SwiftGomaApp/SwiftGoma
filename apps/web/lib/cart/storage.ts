import type { Cart } from "@/lib/api/routes/cart";

const STORAGE_PREFIX = "swiftgoma:cart:";

export type CartMap = Record<string, Cart>;

export function loadCarts(userId: string): CartMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + userId);
    if (!raw) return {};
    return JSON.parse(raw) as CartMap;
  } catch {
    return {};
  }
}

export function saveCarts(userId: string, carts: CartMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(carts));
  } catch {}
}

export function clearCarts(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + userId);
  } catch {}
}
