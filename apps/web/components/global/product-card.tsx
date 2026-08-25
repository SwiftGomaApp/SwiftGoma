"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ProductCardImage {
  src: string;
  alt?: string;
}

export interface ProductCardProps {
  images: ProductCardImage[];
  category: string;
  name: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  isFavorited?: boolean;
  onFavoriteToggle?: (next: boolean) => void;
  onAddToCart?: () => void;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function ProductCard({
  images,
  category,
  name,
  price,
  originalPrice,
  currency = "$",
  isFavorited,
  onFavoriteToggle,
  onAddToCart,
  orientation = "vertical",
  className,
}: ProductCardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [internalFavorited, setInternalFavorited] = useState(false);

  const favorited = isFavorited ?? internalFavorited;
  const active = images[activeIndex] ?? images[0];
  const isHorizontal = orientation === "horizontal";

  function toggleFavorite() {
    const next = !favorited;
    if (isFavorited === undefined) setInternalFavorited(next);
    onFavoriteToggle?.(next);
  }

  const priceBlock = (
    <div className="flex shrink-0 items-baseline gap-1.5">
      {originalPrice != null && originalPrice > price && (
        <span className="text-xs text-muted-foreground line-through">
          {currency}
          {originalPrice.toFixed(2)}
        </span>
      )}
      <span className="text-sm font-semibold text-card-foreground">
        {currency}
        {price.toFixed(2)}
      </span>
    </div>
  );

  const favoriteButton = (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
      onClick={toggleFavorite}
      className="shrink-0 border-border"
    >
      <Heart
        className={cn(
          "size-5 transition-colors",
          favorited
            ? "fill-primary text-primary"
            : "fill-none text-muted-foreground",
        )}
      />
    </Button>
  );

  // ---------- Horizontal (row) layout ----------
  if (isHorizontal) {
    return (
      <div
        data-slot="product-card"
        data-orientation="horizontal"
        className={cn(
          "flex w-full max-w-md items-stretch gap-3 overflow-hidden rounded-2xl bg-card p-3 ring-1 ring-foreground/10 shadow-xs",
          className,
        )}
      >
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-foreground sm:size-28">
          {active && (
            <Image
              src={active.src}
              alt={active.alt ?? name}
              fill
              sizes="112px"
              className="object-cover"
              priority={false}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {category}
            </span>
            <h3 className="truncate text-sm font-medium text-card-foreground">
              {name}
            </h3>
            {priceBlock}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onAddToCart}
              size="sm"
              className="h-8 flex-1 bg-primary text-background hover:bg-primary/85"
            >
              Add to Cart
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={
                favorited ? "Remove from favorites" : "Add to favorites"
              }
              aria-pressed={favorited}
              onClick={toggleFavorite}
              className="shrink-0 border-border"
            >
              <Heart
                className={cn(
                  "size-4 transition-colors",
                  favorited
                    ? "fill-primary text-primary"
                    : "fill-none text-muted-foreground",
                )}
              />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="product-card"
      data-orientation="vertical"
      className={cn(
        "w-full max-w-70 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 shadow-xs",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-foreground">
        {active && (
          <Image
            src={active.src}
            alt={active.alt ?? name}
            fill
            sizes="280px"
            className="object-cover"
            priority={false}
          />
        )}

        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
            {images.map((img, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={img.src + idx}
                  type="button"
                  aria-label={`View ${img.alt ?? name} variant ${idx + 1}`}
                  aria-pressed={isActive}
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "relative size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-background/40 transition-all",
                    isActive && "ring-2 ring-primary",
                  )}
                >
                  <Image
                    src={img.src}
                    alt={img.alt ?? name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {category}
          </span>
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-medium text-card-foreground">
              {name}
            </h3>
            {priceBlock}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={onAddToCart}
            className="h-11 flex-1 bg-primary text-background hover:bg-primary/85"
          >
            Add to Cart
          </Button>
          {favoriteButton}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
