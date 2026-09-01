import "server-only";

import { cache } from "react";
import { createServerApiClient } from "@/lib/api/server";

export type PublicShop = {
  id: string;
  sellerProfileId: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  deliveryFee: string;
  deliveryFeeCurrency: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  _count: { products: number };
};

export type PublicShopDetail = Omit<PublicShop, "_count"> & {
  sellerProfile: {
    contactPhone: string | null;
    contactEmail: string | null;
    whatsappNumber: string | null;
    city: string | null;
  };
  rating: { average: number; count: number };
};

export type ShopListParams = {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
};

export type ShopListPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ShopListResult = {
  shops: PublicShop[];
  pagination: ShopListPagination;
};

type ApiEnvelope<T> = { success: boolean; data: T };

export async function getPublicShops(
  params: ShopListParams = {},
): Promise<ShopListResult> {
  const client = await createServerApiClient();
  const { data } = await client.get<ApiEnvelope<ShopListResult>>(
    "/seller/shops",
    {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search,
        city: params.city,
      },
    },
  );
  return data.data;
}

export const getPublicShopBySlug = cache(
  async (slug: string): Promise<PublicShopDetail> => {
    const client = await createServerApiClient();
    const { data } = await client.get<ApiEnvelope<PublicShopDetail>>(
      `/seller/shop/slug/${encodeURIComponent(slug)}`,
    );
    return data.data;
  },
);
