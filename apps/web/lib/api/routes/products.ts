import "server-only";

import { cache } from "react";
import { createServerApiClient } from "@/lib/api/server";
import type { ProductSortValue } from "@/lib/constants/products";

export type PublicProductImage = {
  id: string;
  url: string;
  position: number;
};

export type PublicProductVariant = {
  id: string;
  price: string;
  stock: number;
};

export type PublicProductShop = {
  id: string;
  name: string;
  slug: string;
  sellerProfile: { city: string | null } | null;
};

export type PublicSubcategory = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export type PublicCategory = PublicSubcategory & {
  subcategories: PublicSubcategory[];
};

export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  brand: string | null;
  currency: string;
  hasVariants: boolean;
  popularityScore: number;
  images: PublicProductImage[];
  variants: PublicProductVariant[];
  subcategory:
    | (PublicSubcategory & {
        category: Pick<PublicCategory, "id" | "name" | "slug">;
      })
    | null;
  shop: PublicProductShop;
};

export type PublicProductDetailVariant = {
  id: string;
  name: string | null;
  attributes: Record<string, string> | null;
  sku: string | null;
  price: string;
  stock: number;
  isDefault: boolean;
};

export type PublicProductReview = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type PublicProductRating = {
  average: number;
  count: number;
};

export type PublicProductDetailShop = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  sellerProfile: { city: string | null } | null;
};

export type PublicProductDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  brand: string | null;
  unit: string;
  weightGrams: number | null;
  expiresAt: string | null;
  currency: string;
  hasVariants: boolean;
  popularityScore: number;
  images: PublicProductImage[];
  variants: PublicProductDetailVariant[];
  subcategory:
    | (PublicSubcategory & {
        category: Pick<PublicCategory, "id" | "name" | "slug">;
      })
    | null;
  shop: PublicProductDetailShop;
  rating: PublicProductRating;
  reviews: PublicProductReview[];
  purchaseCount: number;
};

export type ProductListParams = {
  page?: number;
  limit?: number;
  categoryId?: string;
  subcategoryId?: string;
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStockOnly?: boolean;
  sortBy?: ProductSortValue;
};

export type ProductListPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductListResult = {
  products: PublicProduct[];
  pagination: ProductListPagination;
};

type ApiEnvelope<T> = { success: boolean; data: T };

export async function getPublicProducts(
  params: ProductListParams = {},
): Promise<ProductListResult> {
  const client = await createServerApiClient();
  const { data } = await client.get<ApiEnvelope<ProductListResult>>(
    "/products",
    {
      params: {
        page: params.page,
        limit: params.limit,
        categoryId: params.categoryId,
        subcategoryId: params.subcategoryId,
        currency: params.currency,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        search: params.search,
        inStockOnly: params.inStockOnly,
        sortBy: params.sortBy,
      },
    },
  );
  return data.data;
}

export const getPublicProductBySlug = cache(
  async (slug: string): Promise<PublicProductDetail> => {
    const client = await createServerApiClient();
    const { data } = await client.get<ApiEnvelope<PublicProductDetail>>(
      `/products/slug/${encodeURIComponent(slug)}`,
    );
    return data.data;
  },
);

export async function getPublicCategories(): Promise<PublicCategory[]> {
  const client = await createServerApiClient();
  const { data } = await client.get<ApiEnvelope<PublicCategory[]>>(
    "/products/categories",
  );
  return data.data;
}
