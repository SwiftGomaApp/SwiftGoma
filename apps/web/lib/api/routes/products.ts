import "server-only";

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

export type ProductListParams = {
  page?: number;
  limit?: number;
  categoryId?: string;
  subcategoryId?: string;
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

export async function getPublicCategories(): Promise<PublicCategory[]> {
  const client = await createServerApiClient();
  const { data } = await client.get<ApiEnvelope<PublicCategory[]>>(
    "/products/categories",
  );
  return data.data;
}
