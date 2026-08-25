export const PRODUCTS_PAGE_SIZE = 24;

export const PRODUCT_SORT_OPTIONS = [
  { value: "recent", label: { en: "Newest", fr: "Plus récents" } },
  { value: "popular", label: { en: "Most popular", fr: "Plus populaires" } },
  {
    value: "priceAsc",
    label: { en: "Price: Low to High", fr: "Prix croissant" },
  },
  {
    value: "priceDesc",
    label: { en: "Price: High to Low", fr: "Prix décroissant" },
  },
] as const;

export type ProductSortValue = (typeof PRODUCT_SORT_OPTIONS)[number]["value"];

export const PRODUCT_CURRENCIES = ["USD", "CDF"] as const;

export type ProductCurrency = (typeof PRODUCT_CURRENCIES)[number];
