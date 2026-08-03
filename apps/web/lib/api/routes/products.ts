import { ProductCardData } from "@/components/products/product-card";

type ApiProduct = {
  slug: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  currency: string;
  images: { url: string; position: number }[];
  variants: {
    price: string | number; // Decimal serializes as string over JSON
    stock: number;
    isDefault?: boolean;
  }[];
};

export function mapProductToCardData(product: ApiProduct): ProductCardData {
  const sortedImages = [...product.images]
    .sort((a, b) => a.position - b.position)
    .map((img) => img.url);

  const variant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];

  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand ?? undefined,
    images: sortedImages,
    price: variant ? Number(variant.price) : 0,
    currency: product.currency,
    description: product.description ?? undefined,
  };
}
