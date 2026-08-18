"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel";
import { ImageWithFallback } from "@/components/global/image-with-fallback";
import { CompactProductCard } from "@/components/products/product-card";
import { HeroSearchBar } from "@/components/home/hero-search-bar";
import { HERO_SLIDES } from "@/lib/mock-hero-slides";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<(typeof HERO_SLIDES)[number]["role"], string> = {
  seller: "Vendeur",
  buyer: "Acheteur",
  rider: "Livreur",
  payment: "Paiement en ligne",
};

export function HeroCarousel() {
  // delay: 6000 -> passe à la slide suivante toutes les 6 secondes.
  // stopOnInteraction: false -> l'autoplay reprend après un clic sur une
  // flèche/dot au lieu de s'arrêter définitivement.
  // stopOnMouseEnter: true -> pause au survol (desktop), reprend en quittant.
  const autoplay = useRef(
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );

  return (
    <section aria-label="Présentation SwiftGoma" className="relative w-full">
      <Carousel
        opts={{ loop: true }}
        plugins={[autoplay.current]}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {HERO_SLIDES.map((slide) => (
            <CarouselItem key={slide.role} className="basis-full pl-0">
              <HeroSlideView slide={slide} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <HeroCarouselControls />
      </Carousel>
    </section>
  );
}

function HeroSlideView({ slide }: { slide: (typeof HERO_SLIDES)[number] }) {
  return (
    <div className="relative flex h-[85svh] min-h-140 w-full flex-col overflow-hidden sm:h-[90svh]">
      {/* Fullscreen immersive image */}
      <ImageWithFallback
        src={slide.image}
        alt={`SwiftGoma — ${ROLE_LABEL[slide.role]}`}
        fill
        priority={slide.role === "seller"}
        sizes="100vw"
        className="object-cover"
      />

      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/30" />

      {/* Centered content */}
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 px-4 py-20 text-center sm:gap-6 sm:px-6">
        <span className="rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-wide text-white backdrop-blur-sm sm:text-sm">
          {ROLE_LABEL[slide.role]}
        </span>

        <h1 className="max-w-2xl text-balance text-3xl font-bold text-white sm:text-4xl md:text-5xl">
          {slide.title}
        </h1>

        <p className="max-w-xl text-balance text-sm text-white/85 sm:text-base">
          {slide.description}
        </p>

        <HeroSearchBar
          placeholder={slide.searchPlaceholder}
          className="mt-1 sm:mt-2"
        />

        <div className="mt-2 flex w-full max-w-md justify-center sm:mt-4">
          {slide.products.map((product) => (
            <CompactProductCard
              key={product.slug}
              product={product}
              size="sm"
              className="max-w-none"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroCarouselControls() {
  const { api, scrollPrev, scrollNext, canScrollPrev, canScrollNext } =
    useCarousel();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  return (
    <>
      {/* Prev / next arrows */}
      <button
        type="button"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Slide précédente"
        className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:pointer-events-none disabled:opacity-40 sm:left-6 sm:h-11 sm:w-11"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="Slide suivante"
        className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:pointer-events-none disabled:opacity-40 sm:right-6 sm:h-11 sm:w-11"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-7">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.role}
            type="button"
            onClick={() => api?.scrollTo(i)}
            aria-label={`Aller à la slide ${ROLE_LABEL[slide.role]}`}
            aria-current={selectedIndex === i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              selectedIndex === i
                ? "w-6 bg-white"
                : "w-1.5 bg-white/50 hover:bg-white/75",
            )}
          />
        ))}
      </div>
    </>
  );
}
