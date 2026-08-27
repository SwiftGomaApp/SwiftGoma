import type { EndpointDoc } from "@/lib/types";

const BASE = "/api/v1/favorites";

const sampleFavoriteProduct = {
  id: "prod_7c8d9e",
  name: "Riz parfumé 25kg",
  slug: "riz-parfume-25kg",
  minPrice: 12.5,
  currency: "USD",
  imageUrl: "https://res.cloudinary.com/dx3wclabo/image/upload/v1/products/riz-1.jpg",
};

export const FAVORITE_GROUPS = ["Favorites"] as const;

export const favoriteEndpoints: EndpointDoc[] = [
  {
    slug: "list-favorites",
    method: "GET",
    path: BASE,
    title: "List favorites",
    group: "Favorites",
    auth: "bearer",
    rateLimit: "Session",
    description: "Lists the signed-in user's favorited products, with product summary detail.",
    queryParams: [
      { name: "page", type: "number", required: false, description: "Defaults to 1." },
      { name: "limit", type: "number", required: false, description: "Max 100. Defaults to 20." },
    ],
    successStatus: 200,
    responseExample: {
      success: true,
      data: { products: [sampleFavoriteProduct], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    },
  },
  {
    slug: "list-favorite-ids",
    method: "GET",
    path: `${BASE}/ids`,
    title: "List favorite IDs",
    group: "Favorites",
    auth: "bearer",
    rateLimit: "Session",
    description: "Returns just the product IDs the user has favorited — a lighter call for populating a heart/favorite icon state across a product listing page.",
    successStatus: 200,
    responseExample: { success: true, data: ["prod_7c8d9e", "prod_1a2b3c"] },
  },
  {
    slug: "add-favorite",
    method: "POST",
    path: `${BASE}/:productId`,
    title: "Add favorite",
    group: "Favorites",
    auth: "bearer",
    rateLimit: "Session",
    description: "Favorites a product.",
    pathParams: [{ name: "productId", type: "string", required: true, description: "Product ID." }],
    successStatus: 201,
    responseExample: { success: true, data: { productId: "prod_7c8d9e", favorited: true } },
  },
  {
    slug: "remove-favorite",
    method: "DELETE",
    path: `${BASE}/:productId`,
    title: "Remove favorite",
    group: "Favorites",
    auth: "bearer",
    rateLimit: "Session",
    description: "Unfavorites a product.",
    pathParams: [{ name: "productId", type: "string", required: true, description: "Product ID." }],
    successStatus: 200,
    responseExample: { success: true, data: { productId: "prod_7c8d9e", favorited: false } },
  },
];
