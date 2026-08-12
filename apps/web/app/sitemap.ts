import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";
import { publicApi } from "@/lib/api/routes/public";
import { blogApi } from "@/lib/api/routes/blog";

export const revalidate = 3600;

const STATIC_PATHS: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "products", changeFrequency: "hourly", priority: 0.9 },
  { path: "shops", changeFrequency: "daily", priority: 0.9 },
  { path: "categories", changeFrequency: "weekly", priority: 0.8 },
  { path: "blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "help", changeFrequency: "monthly", priority: 0.6 },
  { path: "status", changeFrequency: "weekly", priority: 0.4 },
  { path: "legal/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "legal/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "legal/cookies", changeFrequency: "yearly", priority: 0.3 },
  { path: "legal/buyer-terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "legal/seller-terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "legal/delivery-terms", changeFrequency: "yearly", priority: 0.3 },
];

async function fetchAllProductSlugs() {
  const slugs: string[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 20) {
    const result = await publicApi.listProducts({ page, limit: 100 });
    slugs.push(...result.products.map((product) => product.slug));
    totalPages = result.pagination.totalPages;
    page += 1;
  }

  return slugs;
}

async function fetchAllShopSlugs() {
  const slugs: string[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 10) {
    const result = await publicApi.listShops({ page, limit: 100 });
    slugs.push(...result.shops.map((shop) => shop.slug));
    totalPages = result.pagination.totalPages;
    page += 1;
  }

  return slugs;
}

async function fetchAllBlogSlugs() {
  const slugs: string[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 10) {
    const result = await blogApi.list({ page, limit: 100 });
    slugs.push(...result.posts.map((post) => post.slug));
    totalPages = result.pagination.totalPages;
    page += 1;
  }

  return slugs;
}

async function fetchCategorySlugs() {
  try {
    const categories = await publicApi.listCategories();
    return categories.map((category) => category.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, changeFrequency, priority }) => ({
      url: path ? `${SITE_URL}/${path}` : SITE_URL,
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  let productSlugs: string[] = [];
  let shopSlugs: string[] = [];
  let blogSlugs: string[] = [];
  let categorySlugs: string[] = [];

  try {
    [productSlugs, shopSlugs, blogSlugs, categorySlugs] = await Promise.all([
      fetchAllProductSlugs().catch(() => []),
      fetchAllShopSlugs().catch(() => []),
      fetchAllBlogSlugs().catch(() => []),
      fetchCategorySlugs(),
    ]);
  } catch (err) {
    console.warn("[sitemap] Failed to load dynamic routes:", (err as Error).message);
  }

  const productEntries: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${SITE_URL}/products/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const shopEntries: MetadataRoute.Sitemap = shopSlugs.map((slug) => ({
    url: `${SITE_URL}/shops/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${SITE_URL}/categories/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...productEntries,
    ...shopEntries,
    ...blogEntries,
    ...categoryEntries,
  ];
}
