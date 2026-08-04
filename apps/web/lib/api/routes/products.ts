import { ProductCardData } from "@/components/products/product-card";

type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  currency: string;
  images: { url: string; position: number }[];
  variants: {
    id: string;
    price: string | number;
    stock: number;
    isDefault?: boolean;
  }[];
  shop: { id: string };
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
    cart: variant
      ? {
          shopId: product.shop.id,
          productId: product.id,
          variantId: variant.id,
          price: String(variant.price),
          stock: variant.stock,
        }
      : undefined,
  };
}
