"use client";

import { useEffect, useState } from "react";
import {
  recordRecentlyViewed,
  getRecentlyViewed,
  type RecentlyViewedItem,
} from "@/hooks/use-recently-viewed";
import { FeaturedProductCard } from "@/components/products/product-card";

type RecentlyViewedProps = {
  currentProduct: RecentlyViewedItem;
};

export function RecentlyViewed({ currentProduct }: RecentlyViewedProps) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    recordRecentlyViewed(currentProduct);
    setItems(getRecentlyViewed(currentProduct.slug));
    // Only run once per product page visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct.slug]);

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-10">
      <h2 className="text-lg font-semibold text-foreground">
        Consultés récemment
      </h2>
      <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <div key={item.slug} className="w-64 shrink-0">
            <FeaturedProductCard
              product={{
                slug: item.slug,
                name: item.name,
                images: [item.image],
                price: item.price,
                currency: item.currency,
                cart: item.cart,
              }}
              size="sm"
              className="max-w-none"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
