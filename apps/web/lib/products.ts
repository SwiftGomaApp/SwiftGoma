import type { ProductCardImage } from "@/components/global/product-card";
import type { PublicProduct } from "@/lib/api/routes/products";

export function getProductStartingPrice(product: PublicProduct): number {
  const variant = product.variants[0];
  if (!variant) return 0;
  const parsed = Number.parseFloat(variant.price);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getProductImages(product: PublicProduct): ProductCardImage[] {
  return product.images.map((image) => ({ src: image.url, alt: product.name }));
}

export function getProductCategoryLabel(product: PublicProduct): string {
  return product.subcategory?.category.name ?? product.subcategory?.name ?? "";
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  CDF: "FC ",
};

export function getCurrencyPrefix(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? `${currency} `;
}
