import { unstable_cache } from "next/cache";
import { env } from "@/lib/api/config/env";
import type {
  Category,
  HeroSlide,
  Plan,
  ProductListItem,
} from "@/lib/api/routes/public";

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

async function fetchHeroSlides(): Promise<HeroSlide[]> {
  const res = await fetch(`${env.server.apiBaseUrl}/storefront/hero`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Hero slides fetch failed: ${res.status}`);
  }

  const body = await res.json();
  return body.data as HeroSlide[];
}

export const getCachedHeroSlides = unstable_cache(
  fetchHeroSlides,
  ["storefront-hero-slides"],
  { revalidate: 300, tags: ["storefront-hero-slides"] },
);

async function fetchPopularProducts(limit: number): Promise<ProductListItem[]> {
  const res = await fetch(
    `${env.server.apiBaseUrl}/products/popular?limit=${limit}`,
    {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 300 },
    },
  );

  if (!res.ok) {
    throw new Error(`Popular products fetch failed: ${res.status}`);
  }

  const body = await res.json();
  return body.data.products as ProductListItem[];
}

export const getCachedPopularProducts = unstable_cache(
  fetchPopularProducts,
  ["popular-products"],
  { revalidate: 300, tags: ["popular-products"] },
);

async function fetchPlans(): Promise<Plan[]> {
  const res = await fetch(`${env.server.apiBaseUrl}/plans`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(`Plans fetch failed: ${res.status}`);
  }

  const body = await res.json();
  return body.data as Plan[];
}

export const getCachedPlans = unstable_cache(fetchPlans, ["plans"], {
  revalidate: 900,
  tags: ["plans"],
});
