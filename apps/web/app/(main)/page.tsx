// app/page.tsx
"use client";

import { useState } from "react";
import {
  FeaturedProductCard,
  CompactProductCard,
  type ProductCardData,
} from "@/components/products/product-card";

const MOCK_FEATURED: ProductCardData = {
  slug: "nike-running-shoe",
  name: "Nike Running Shoe",
  images: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
  ],
  price: 69.99,
  currency: "USD",
  tags: ["EU38", "BLACK/WHITE"],
  description:
    "Crossing hardboard comfort with off-court flair. '80s-inspired construction, bold details and nothin'-but-net style.",
};

const MOCK_COMPACT: ProductCardData = {
  slug: "nike-presto-shoe",
  name: "Nike Presto Shoe",
  images: [
    "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&q=80",
  ],
  price: 67.99,
  currency: "USD",
  subtitle: "Black/White",
  size: "EU 38",
};

export default function Home() {
  const [quantity, setQuantity] = useState(10);

  return (
    <div className="flex min-h-screen flex-col items-center gap-12 px-6 py-16">
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          Featured variant
        </h2>
        <FeaturedProductCard
          product={MOCK_FEATURED}
          onAddToCart={(slug) => console.log("add to cart:", slug)}
          size="lg"
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          Compact variant
        </h2>
        <CompactProductCard
          product={MOCK_COMPACT}
          quantity={quantity}
          onQuantityChange={(_, q) => setQuantity(q)}
          onRemove={(slug) => console.log("remove:", slug)}
          size="lg"
          maxQuantity={20}
        />
      </div>
    </div>
  );
}
