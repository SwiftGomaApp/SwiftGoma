"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  slug: string;
  name: string;
  brand?: string;
  images: string[];
  price: number;
  currency: string;
  description?: string;
  tags?: string[];
  subtitle?: string;
  size?: string;
};

export type CardSize = "sm" | "md" | "lg";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currency === "CDF" ? 0 : 2,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(price);
}

// ============================================================
// Featured — swipeable image carousel with arrows + dots,
// wishlist toggle, add to cart
// ============================================================

const FEATURED_SIZE_CONFIG: Record<
  CardSize,
  {
    maxWidth: string;
    padding: string;
    title: string;
    gap: string;
  }
> = {
  sm: {
    maxWidth: "max-w-64",
    padding: "p-4",
    title: "text-base",
    gap: "gap-2",
  },
  md: {
    maxWidth: "max-w-sm",
    padding: "p-5",
    title: "text-lg",
    gap: "gap-3",
  },
  lg: {
    maxWidth: "max-w-md",
    padding: "p-6",
    title: "text-xl",
    gap: "gap-4",
  },
};

type FeaturedProductCardProps = {
  product: ProductCardData;
  size?: CardSize;
  onAddToCart?: (slug: string) => void;
  className?: string;
};

export function FeaturedProductCard({
  product,
  size = "md",
  onAddToCart,
  className,
}: FeaturedProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const config = FEATURED_SIZE_CONFIG[size];

  const images =
    product.images.length > 0 ? product.images : ["/placeholder-product.png"];

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }

  function scrollToIndex(index: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        config.maxWidth,
        className,
      )}
    >
      {/* Image carousel */}
      <div className="group relative aspect-4/3 w-full">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <Link
              key={i}
              href={`/products/${product.slug}`}
              className="relative h-full w-full shrink-0 snap-center"
            >
              <Image
                src={src}
                alt={`${product.name} — image ${i + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, 400px"
                className="object-cover"
                priority={i === 0}
              />
            </Link>
          ))}
        </div>

        {/* Prev / next arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollToIndex(Math.max(activeIndex - 1, 0))}
              disabled={activeIndex === 0}
              aria-label="Image précédente"
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur transition-opacity hover:bg-background disabled:pointer-events-none disabled:opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                scrollToIndex(Math.min(activeIndex + 1, images.length - 1))
              }
              disabled={activeIndex === images.length - 1}
              aria-label="Image suivante"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur transition-opacity hover:bg-background disabled:pointer-events-none disabled:opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                aria-label={`Voir l'image ${i + 1}`}
                aria-current={activeIndex === i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  activeIndex === i
                    ? "w-4 bg-background"
                    : "w-1.5 bg-background/50 hover:bg-background/75",
                )}
              />
            ))}
          </div>
        )}

        {/* Wishlist */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted((v) => !v);
          }}
          aria-label={
            isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"
          }
          aria-pressed={isWishlisted}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isWishlisted
                ? "fill-primary text-primary"
                : "text-muted-foreground",
            )}
          />
        </button>
      </div>

      {/* Content */}
      <div className={cn("flex flex-1 flex-col", config.gap, config.padding)}>
        <Link href={`/products/${product.slug}`}>
          <h3
            className={cn(
              "font-semibold text-foreground hover:underline",
              config.title,
            )}
          >
            {product.name}
          </h3>
        </Link>

        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {product.description && size !== "sm" && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {product.description}
          </p>
        )}

        {/* Content — bottom price/CTA block only, replace this inside FeaturedProductCard */}
        {size === "sm" ? (
          <div className="mt-auto flex flex-col gap-2 pt-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Prix</span>
              <span className="text-lg font-bold text-foreground">
                {formatPrice(product.price, product.currency)}
              </span>
            </div>
            <Button
              onClick={() => onAddToCart?.(product.slug)}
              className="w-full"
            >
              Ajouter au panier
            </Button>
          </div>
        ) : (
          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Prix</span>
              <span className="text-lg font-bold text-foreground">
                {formatPrice(product.price, product.currency)}
              </span>
            </div>
            <Button onClick={() => onAddToCart?.(product.slug)}>
              Ajouter au panier
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Compact — cart-item row: image flush left, remove top-right,
// quantity stepper bottom-right
// ============================================================

const COMPACT_SIZE_CONFIG: Record<
  CardSize,
  {
    maxWidth: string;
    imageWidth: string;
    padding: string;
    title: string;
  }
> = {
  sm: {
    maxWidth: "max-w-sm",
    imageWidth: "w-20",
    padding: "p-3",
    title: "text-sm",
  },
  md: {
    maxWidth: "max-w-md",
    imageWidth: "w-28",
    padding: "p-4",
    title: "text-sm",
  },
  lg: {
    maxWidth: "max-w-lg",
    imageWidth: "w-32",
    padding: "p-5",
    title: "text-base",
  },
};

type CompactProductCardProps = {
  product: ProductCardData;
  quantity: number;
  size?: CardSize;
  onQuantityChange?: (slug: string, quantity: number) => void;
  onRemove?: (slug: string) => void;
  minQuantity?: number;
  maxQuantity?: number;
  className?: string;
};

export function CompactProductCard({
  product,
  quantity,
  size = "md",
  onQuantityChange,
  onRemove,
  minQuantity = 1,
  maxQuantity,
  className,
}: CompactProductCardProps) {
  const canDecrease = quantity > minQuantity;
  const canIncrease = maxQuantity === undefined || quantity < maxQuantity;
  const coverImage = product.images[0] ?? "/placeholder-product.png";
  const config = COMPACT_SIZE_CONFIG[size];

  return (
    <div
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        config.maxWidth,
        className,
      )}
    >
      {/* Image — flush left, square, sized off its own width */}
      <Link
        href={`/products/${product.slug}`}
        className={cn(
          "relative aspect-square shrink-0 self-stretch bg-muted",
          config.imageWidth,
        )}
      >
        <Image
          src={coverImage}
          alt={product.name}
          fill
          sizes="128px"
          className="object-cover"
        />
      </Link>

      {/* Right column: top row (info + remove), bottom row (price + stepper) */}
      <div
        className={cn(
          "flex flex-1 flex-col justify-between gap-3",
          config.padding,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <Link href={`/products/${product.slug}`}>
              <p
                className={cn(
                  "font-semibold text-foreground hover:underline",
                  config.title,
                )}
              >
                {product.name}
              </p>
            </Link>
            {product.subtitle && (
              <p className="text-xs text-muted-foreground">
                {product.subtitle}
              </p>
            )}
            {product.size && (
              <p className="text-xs text-muted-foreground">{product.size}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onRemove?.(product.slug)}
            aria-label="Retirer"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-foreground">
            {formatPrice(product.price, product.currency)}
          </p>

          <div className="flex shrink-0 items-center gap-1 rounded-full border border-border">
            <button
              type="button"
              onClick={() =>
                canDecrease && onQuantityChange?.(product.slug, quantity - 1)
              }
              disabled={!canDecrease}
              aria-label="Diminuer la quantité"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-5 text-center text-sm font-medium text-foreground tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                canIncrease && onQuantityChange?.(product.slug, quantity + 1)
              }
              disabled={!canIncrease}
              aria-label="Augmenter la quantité"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
