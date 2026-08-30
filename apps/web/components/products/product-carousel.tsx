"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import ProductCard from "@/components/global/product-card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel";
import { useCart } from "@/lib/cart/cart-context";
import type { PublicProduct } from "@/lib/api/routes/products";
import {
  getCurrencyPrefix,
  getProductCategoryLabel,
  getProductImages,
  getProductStartingPrice,
} from "@/lib/products";

// Fixed pixel widths (not percentages) on purpose: a percentage flex-basis
// combined with the ProductCard's nested aspect-square image box triggers a
// Safari flexbox bug where the item collapses toward its content width
// instead of the intended basis, producing visibly uneven card sizes.
const ITEM_CLASS =
  "basis-[200px] pl-4 sm:basis-[220px] md:basis-[250px] lg:basis-70";

// Same Safari flex + aspect-ratio bug also breaks the image's aspect-square
// height inside this carousel (some cards render shorter than others even
// though their widths now match). Give the image a fixed height per
// breakpoint, matching ITEM_CLASS's widths, instead of relying on
// aspect-ratio to derive it.
const IMAGE_CLASS = "h-[200px] sm:h-[220px] md:h-[250px] lg:h-70";

const FADE_WIDTH = 40;

function CarouselEdgeFade({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { canScrollPrev, canScrollNext } = useCarousel();

  const maskImage = `linear-gradient(to right, transparent, black ${
    canScrollPrev ? `${FADE_WIDTH}px` : "0px"
  }, black ${canScrollNext ? `calc(100% - ${FADE_WIDTH}px)` : "100%"}, transparent)`;

  return (
    <div
      className={className}
      style={{ maskImage, WebkitMaskImage: maskImage }}
    >
      {children}
    </div>
  );
}

function CarouselArrows() {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } =
    useCarousel();

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-full"
        disabled={!canScrollPrev}
        onClick={scrollPrev}
      >
        <ChevronLeft />
        <span className="sr-only">Previous</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-full"
        disabled={!canScrollNext}
        onClick={scrollNext}
      >
        <ChevronRight />
        <span className="sr-only">Next</span>
      </Button>
    </div>
  );
}

export function ProductCarousel({
  products,
  viewAllHref,
  viewAllLabel,
  ctaLabel,
}: {
  products: PublicProduct[];
  viewAllHref: string;
  viewAllLabel: string;
  ctaLabel: string;
}) {
  const { addItem } = useCart();

  return (
    <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
      <div className="flex items-center justify-end gap-2">
        <CarouselArrows />
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={viewAllHref} />}
        >
          {viewAllLabel}
        </Button>
      </div>

      <CarouselEdgeFade className="mt-4">
        <CarouselContent>
          {products.map((product) => {
            const variant = product.variants[0];
            return (
              <CarouselItem key={product.id} className={ITEM_CLASS}>
                <Link href={`/products/${product.slug}`} className="block">
                  <ProductCard
                    images={getProductImages(product)}
                    category={getProductCategoryLabel(product)}
                    name={product.name}
                    price={getProductStartingPrice(product)}
                    currency={getCurrencyPrefix(product.currency)}
                    imageClassName={IMAGE_CLASS}
                    eagerLoad
                    onAddToCart={() => {
                      if (!variant) return;
                      addItem(product.shop.id, variant.id, 1, product.name);
                    }}
                  />
                </Link>
              </CarouselItem>
            );
          })}
          <CarouselItem className={ITEM_CLASS}>
            <Link
              href={viewAllHref}
              className="flex h-full min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/50"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ArrowRight className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-foreground">
                {ctaLabel}
              </span>
            </Link>
          </CarouselItem>
        </CarouselContent>
      </CarouselEdgeFade>
    </Carousel>
  );
}

export default ProductCarousel;
