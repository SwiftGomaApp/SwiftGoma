import { unstable_cache } from "next/cache";
import { env } from "@/lib/api/config/env";
import type { Category } from "@/lib/api/routes/public";

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${env.server.apiBaseUrl}/products/categories`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Categories fetch failed: ${res.status}`);
  }

  const body = await res.json();
  return body.data as Category[];
}

export const getCachedCategories = unstable_cache(
  fetchCategories,
  ["product-categories"],
  { revalidate: 300, tags: ["product-categories"] },
);
