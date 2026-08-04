import { api } from "../client";

export type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  subcategories: Subcategory[];
};

export type ProductListParams = {
  page?: number;
  limit?: number;
  categoryId?: string;
  subcategoryId?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: "USD" | "CDF";
  search?: string;
  inStockOnly?: boolean;
  city?: string;
  sortBy?: "recent" | "priceAsc" | "priceDesc";
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  images: { url: string; position: number }[];
  variants: { id: string; price: string; stock: number }[];
  subcategory: { id: string; name: string; category: Category };
  shop: {
    id: string;
    name: string;
    slug: string;
    sellerProfile: { city: string | null } | null;
  };
};

export type ProductListResponse = {
  products: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProductVariantDetail = {
  id: string;
  name: string | null;
  attributes: Record<string, string> | null;
  sku: string | null;
  price: string;
  stock: number;
  isDefault: boolean;
};

export type Shop = {
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
  sellerProfile: {
    contactPhone: string;
    contactEmail: string;
    whatsappNumber: string;
    city: string;
  };
  rating?: {
    average: number;
    count: number;
  };
};

export type ShopListItem = Shop & {
  _count: { products: number };
};

export type ShopListParams = {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
};

export type ShopListResponse = {
  shops: ShopListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProductDetail = {
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
  images: { url: string; position: number }[];
  variants: ProductVariantDetail[];
  subcategory: {
    id: string;
    name: string;
    slug: string;
    category: { id: string; name: string; slug: string };
  };
  shop: {
    id: string;
    name: string;
    slug: string;
  };
  rating?: {
    average: number;
    count: number;
  };
  purchaseCount?: number;
  reviews?: {
    id: string;
    authorName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
};

export const publicApi = {
  async listCategories(): Promise<Category[]> {
    const { data } = await api.get("/products/categories");
    return data.data;
  },

  async getCategory(id: string): Promise<Category> {
    const { data } = await api.get(`/products/categories/${id}`);
    return data.data;
  },

  async listProducts(
    params: ProductListParams = {},
  ): Promise<ProductListResponse> {
    const { data } = await api.get("/products", { params });
    return data.data;
  },

  async getProductBySlug(slug: string): Promise<ProductDetail> {
    const { data } = await api.get(`/products/slug/${slug}`);
    return data.data;
  },

  async getShopBySlug(slug: string): Promise<Shop> {
    const { data } = await api.get(`/seller/shop/slug/${slug}`);
    return data.data;
  },

  async listShops(params: ShopListParams = {}): Promise<ShopListResponse> {
    const { data } = await api.get("/seller/shops", { params });
    return data.data;
  },
};
