"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeaturedProductCard } from "@/components/products/product-card";
import { mapProductToCardData } from "@/lib/api/routes/products";
import type { ProductListItem } from "@/lib/api/routes/public";

type SimilarProductsCarouselProps = {
  products: ProductListItem[];
  title?: string;
};

export function SimilarProductsCarousel({
  products,
  title = "Produits similaires",
}: SimilarProductsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (products.length === 0) return null;

  function updateArrowState() {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }

  function scrollByCard(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("[data-card]")?.clientWidth ?? 256;
    el.scrollBy({ left: direction * (cardWidth + 24), behavior: "smooth" });
  }

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={!canScrollLeft}
            aria-label="Précédent"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={!canScrollRight}
            aria-label="Suivant"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={updateArrowState}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div key={product.id} data-card className="w-64 shrink-0">
            <FeaturedProductCard
              product={mapProductToCardData(product)}
              size="sm"
              className="max-w-none"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
