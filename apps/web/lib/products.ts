import type { ProductCardImage } from "@/components/global/product-card";
import type {
  PublicProduct,
  PublicProductDetailVariant,
} from "@/lib/api/routes/products";

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

export function formatMoney(amount: number, currency: string): string {
  const locale = currency === "CDF" ? "fr-CD" : "en-US";
  const fractionDigits = currency === "CDF" ? 0 : 2;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
  return `${getCurrencyPrefix(currency)}${formatted}`;
}

export function getDefaultVariant(
  variants: PublicProductDetailVariant[],
): PublicProductDetailVariant | undefined {
  return variants.find((variant) => variant.isDefault) ?? variants[0];
}

export function getVariantAttributeAxes(
  variants: PublicProductDetailVariant[],
): { key: string; values: string[] }[] {
  const axes = new Map<string, Set<string>>();
  for (const variant of variants) {
    if (!variant.attributes) continue;
    for (const [key, value] of Object.entries(variant.attributes)) {
      if (typeof value !== "string") continue;
      if (!axes.has(key)) axes.set(key, new Set());
      axes.get(key)!.add(value);
    }
  }
  return Array.from(axes.entries()).map(([key, values]) => ({
    key,
    values: Array.from(values),
  }));
}

export function findVariantByAttributes(
  variants: PublicProductDetailVariant[],
  selected: Record<string, string>,
): PublicProductDetailVariant | undefined {
  return variants.find((variant) => {
    const attrs = variant.attributes ?? {};
    return Object.entries(selected).every(
      ([key, value]) => attrs[key] === value,
    );
  });
}

export function getVariantOptionLabel(
  variant: PublicProductDetailVariant,
): string {
  if (variant.attributes) {
    const values = Object.values(variant.attributes).filter(
      (v): v is string => typeof v === "string",
    );
    if (values.length > 0) return values.join(" / ");
  }
  return variant.name ?? variant.sku ?? "—";
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })} kg`;
  }
  return `${grams} g`;
}
