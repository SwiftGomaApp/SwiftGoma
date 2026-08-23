import type { MetadataRoute } from "next";

const SITE_URL = "https://swiftgoma.com";
const API_URL = process.env.API_URL ?? "https://api.swiftgoma.com";

type ProductSitemapEntry = { slug: string; updatedAt: string };
type ShopSitemapEntry = { slug: string; updatedAt: string };

async function fetchProducts(): Promise<ProductSitemapEntry[]> {
  try {
    const res = await fetch(`${API_URL}/sitemap/products`, {
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
    const res = await fetch(`${API_URL}/sitemap/shops`, {
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

// ========================= ADD THIS TO THE SERVER ==============================

// // routes/sitemap.routes.js (Express)
// import { Router } from "express";
// import prisma from "../config/prisma.js"; // your actual prisma client path

// const router = Router();

// // GET /sitemap/products
// router.get("/sitemap/products", async (req, res) => {
//   try {
//     const products = await prisma.product.findMany({
//       where: { status: "ACTIVE" },
//       select: { slug: true, updatedAt: true },
//       take: 5000,
//     });
//     res.json(products);
//   } catch (err) {
//     res.status(500).json([]);
//   }
// });

// // GET /sitemap/shops
// router.get("/sitemap/shops", async (req, res) => {
//   try {
//     const shops = await prisma.shop.findMany({
//       where: { status: "ACTIVE" },
//       select: { slug: true, updatedAt: true },
//     });
//     res.json(shops);
//   } catch (err) {
//     res.status(500).json([]);
//   }
// });

// export default router;
