"use client";

import Link from "next/link";
import ProductCard from "@/components/global/product-card";
import { useCart } from "@/lib/cart/cart-context";
import type { PublicProduct } from "@/lib/api/routes/products";
import {
  getCurrencyPrefix,
  getProductCategoryLabel,
  getProductImages,
  getProductStartingPrice,
} from "@/lib/products";

export function ProductGrid({ products }: { products: PublicProduct[] }) {
  const { addItem } = useCart();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {products.map((product) => {
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
              className="max-w-none"
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

export default ProductGrid;
