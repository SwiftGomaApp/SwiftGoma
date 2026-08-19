import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CarouselProductCard } from "@/components/products/product-card";
import { mapProductToCardData } from "@/lib/api/routes/products";
import type { ProductListItem } from "@/lib/api/routes/public";

type PopularProductsSectionProps = {
  products: ProductListItem[];
};

export function PopularProductsSection({
  products,
}: PopularProductsSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12">
      <Carousel opts={{ align: "start" }} className="w-full">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
              <Flame className="h-3.5 w-3.5" />
              Populaire en ce moment
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Produits populaires
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/products"
              className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
            >
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="hidden items-center gap-1.5 sm:flex">
              <CarouselPrevious className="static h-8 w-8 translate-x-0 translate-y-0" />
              <CarouselNext className="static h-8 w-8 translate-x-0 translate-y-0" />
            </div>
          </div>
        </div>

        <CarouselContent className="-ml-4 pt-4">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="basis-[68%] pl-4 sm:basis-1/3 lg:basis-1/4"
            >
              <CarouselProductCard
                product={mapProductToCardData(product)}
                size="sm"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <Link
        href="/products"
        className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden"
      >
        Voir tout
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
