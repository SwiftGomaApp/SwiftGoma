"use client";

const STORAGE_KEY = "swiftgoma-recently-viewed";
const MAX_ITEMS = 12;

export type RecentlyViewedItem = {
  slug: string;
  name: string;
  image: string;
  price: number;
  currency: string;
};

export function recordRecentlyViewed(item: RecentlyViewedItem) {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];
    const filtered = items.filter((i) => i.slug !== item.slug);
    const updated = [item, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private browsing, etc.) — silently skip
  }
}

export function getRecentlyViewed(excludeSlug?: string): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];
    return excludeSlug ? items.filter((i) => i.slug !== excludeSlug) : items;
  } catch {
    return [];
  }
}
