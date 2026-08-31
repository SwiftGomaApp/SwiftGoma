"use client";

import Link from "next/link";
import ProductCard from "@/components/global/product-card";
import { useCart } from "@/lib/cart/cart-context";
import { useFavorites } from "@/lib/favorites/favorites-context";
import type { PublicProduct } from "@/lib/api/routes/products";
import {
  getCurrencyPrefix,
  getProductCategoryLabel,
  getProductImages,
  getProductStartingPrice,
} from "@/lib/products";

export function FavoritesGrid({ products }: { products: PublicProduct[] }) {
  const { addItem } = useCart();
  const { favoritesIds, isLoading, toggle } = useFavorites();

  const visibleProducts = isLoading
    ? products
    : products.filter((p) => favoritesIds.has(p.id));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {visibleProducts.map((product) => {
        const variant = product.variants[0];
        return (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="block"
          >
            <ProductCard
              images={getProductImages(product)}
              category={getProductCategoryLabel(product)}
              name={product.name}
              price={getProductStartingPrice(product)}
              currency={getCurrencyPrefix(product.currency)}
              orientation="horizontal"
              className="max-w-none w-full"
              isFavorited
              onFavoriteToggle={() => toggle(product.id, product.name)}
              onAddToCart={() => {
                if (!variant) return;
                addItem(product.shop.id, variant.id, 1, product.name);
              }}
            />
          </Link>
        );
      })}
    </div>
  );
}
