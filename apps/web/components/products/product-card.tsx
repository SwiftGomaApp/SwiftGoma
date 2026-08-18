"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  X,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import { useRouter } from "next/navigation";

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
  cart?: {
    shopId: string;
    productId: string;
    variantId: string;
    price: string;
    stock: number;
  };
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
// wishlist toggle, add to cart (UNTOUCHED)
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
  const { addToCart } = useCart();
  const { isFavorited, toggleFavorite } = useFavorites();
  const favoriteProductId = product.cart?.productId;
  const isWishlisted = favoriteProductId
    ? isFavorited(favoriteProductId)
    : false;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const config = FEATURED_SIZE_CONFIG[size];

  const images =
    product.images.length > 0 ? product.images : ["/placeholder-product.png"];

  const outOfStock = product.cart !== undefined && product.cart.stock <= 0;

  function handleAddToCart() {
    if (!product.cart) {
      onAddToCart?.(product.slug);
      return;
    }

    addToCart({
      shopId: product.cart.shopId,
      variantId: product.cart.variantId,
      quantity: 1,
      variant: {
        id: product.cart.variantId,
        name: null,
        attributes: null,
        price: product.cart.price,
        stock: product.cart.stock,
        product: {
          id: product.cart.productId,
          name: product.name,
          slug: product.slug,
          currency: product.currency,
          status: "PUBLISHED",
          images: product.images.map((url, position) => ({ url, position })),
        },
      },
    });
  }

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

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (favoriteProductId) toggleFavorite(favoriteProductId);
          }}
          disabled={!favoriteProductId}
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

        {size === "sm" ? (
          <div className="mt-auto flex flex-col gap-2 pt-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Prix</span>
              <span className="text-lg font-bold text-foreground">
                {formatPrice(product.price, product.currency)}
              </span>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="w-full"
            >
              {outOfStock ? "Rupture de stock" : "Ajouter au panier"}
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
            <Button onClick={handleAddToCart} disabled={outOfStock}>
              {outOfStock ? "Rupture de stock" : "Ajouter au panier"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Compact — Updated with Name/Subtitle on Top, Price on Bottom,
// Removed quantity/X, Added Eye Button.
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
    imageWidth: "w-24",
    padding: "p-3",
    title: "text-sm",
  },
  md: {
    maxWidth: "max-w-md",
    imageWidth: "w-28",
    padding: "p-4",
    title: "text-base",
  },
  lg: {
    maxWidth: "max-w-lg",
    imageWidth: "w-32",
    padding: "p-5",
    title: "text-lg",
  },
};

type CompactProductCardProps = {
  product: ProductCardData;
  size?: CardSize;
  className?: string;
};

export function CompactProductCard({
  product,
  size = "md",
  className,
}: CompactProductCardProps) {
  const coverImage = product.images[0] ?? "/placeholder-product.png";
  const config = COMPACT_SIZE_CONFIG[size];

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleView() {
    startTransition(() => {
      router.push(`/products/${product.slug}`);
    });
  }

  return (
    <div
      className={cn(
        "group flex w-full items-stretch overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl transition-all hover:bg-black/50",
        config.maxWidth,
        className,
      )}
    >
      {/* Image — Left Side */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden m-2 rounded-xl aspect-square",
          config.imageWidth,
        )}
      >
        <Image
          src={coverImage}
          alt={product.name}
          fill
          sizes="160px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Content — Left Aligned */}
      <div className="flex flex-1 flex-col justify-between py-4 pr-5 pl-2 text-left">
        {/* Top Section: Name and Subtitle */}
        <div>
          <h4 className={cn("font-bold text-white line-clamp-1", config.title)}>
            {product.name}
          </h4>
          {product.subtitle && (
            <p className="text-xs text-white/60 line-clamp-1 mt-0.5">
              {product.subtitle}
            </p>
          )}
        </div>

        {/* Bottom Section: Price and View Button */}
        <div className="flex items-end justify-between">
          <p className="text-base font-bold text-white">
            {formatPrice(product.price, product.currency)}
          </p>

          <Button
            onClick={handleView}
            disabled={isPending}
            aria-busy={isPending}
            aria-label="Voir le produit"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <p>{isPending ? "Chargement..." : "Voir le produit"}</p>
          </Button>
        </div>
      </div>
    </div>
  );
}
