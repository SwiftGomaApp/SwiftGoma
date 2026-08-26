import type { MetadataRoute } from "next";

const SITE_URL = "https://swiftgoma.com";
const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://api.swiftgoma.com/api/v1";

type ProductSitemapEntry = { slug: string; updatedAt: string };
type ShopSitemapEntry = { slug: string; updatedAt: string };

async function fetchProducts(): Promise<ProductSitemapEntry[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sitemap/products`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchShops(): Promise<ShopSitemapEntry[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/sitemap/shops`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/sell`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const [products, shops] = await Promise.all([fetchProducts(), fetchShops()]);

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const shopRoutes: MetadataRoute.Sitemap = shops.map((s) => ({
    url: `${SITE_URL}/shops/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...shopRoutes];
}
