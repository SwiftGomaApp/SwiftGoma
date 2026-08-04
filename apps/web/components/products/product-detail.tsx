// components/products/product-detail.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButton } from "./share-button";
import { RatingStars } from "./rating-stars";
import { ProductReviews } from "./product-reviews";
import { cn } from "@/lib/utils";
import type {
  ProductDetail as ProductDetailData,
  ProductVariantDetail,
} from "@/lib/api/routes/public";
import { useCart } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import { reviewsApi } from "@/lib/api/routes/reviews";
import { ApiException } from "@/lib/api";
import { toast } from "@/lib/toast";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currency === "CDF" ? 0 : 2,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(price);
}

function formatWeight(grams: number) {
  return grams >= 1000
    ? `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg`
    : `${grams} g`;
}

function formatExpiry(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

function getAttributeOptions(variants: ProductVariantDetail[]) {
  const options: Record<string, string[]> = {};
  for (const variant of variants) {
    if (!variant.attributes) continue;
    for (const [key, value] of Object.entries(variant.attributes)) {
      if (!options[key]) options[key] = [];
      if (!options[key].includes(value)) options[key].push(value);
    }
  }
  return options;
}

function findMatchingVariant(
  variants: ProductVariantDetail[],
  selection: Record<string, string>,
) {
  return variants.find((v) =>
    Object.entries(selection).every(
      ([key, value]) => v.attributes?.[key] === value,
    ),
  );
}

const LOW_STOCK_THRESHOLD = 5;

type ProductDetailProps = {
  product: ProductDetailData;
};

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const { isFavorited, toggleFavorite } = useFavorites();
  const isWishlisted = isFavorited(product.id);
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);

  async function handleReviewSubmit(rating: number, comment: string) {
    try {
      await reviewsApi.submit(product.id, { rating, comment });
      toast.success("Merci pour votre avis !");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiException
          ? err.message
          : "Impossible d'envoyer votre avis.",
      );
    }
  }

  const attributeOptions = useMemo(
    () => getAttributeOptions(product.variants),
    [product.variants],
  );
  const attributeKeys = Object.keys(attributeOptions);

  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];

  const [selection, setSelection] = useState<Record<string, string>>(
    defaultVariant?.attributes ?? {},
  );

  const selectedVariant =
    attributeKeys.length > 0
      ? findMatchingVariant(product.variants, selection)
      : defaultVariant;

  const images =
    product.images.length > 0
      ? product.images
      : [{ url: "/placeholder-product.png", position: 0 }];
  const inStock = (selectedVariant?.stock ?? 0) > 0;
  const isLowStock =
    inStock && (selectedVariant?.stock ?? 0) <= LOW_STOCK_THRESHOLD;
  const maxQuantity = selectedVariant?.stock ?? 0;

  const productUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `/products/${product.slug}`;

  useEffect(() => {
    function handleScroll() {
      const trigger = document.getElementById("main-add-to-cart");
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setShowStickyBar(rect.bottom < 0);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleAttributeSelect(key: string, value: string) {
    setSelection((prev) => ({ ...prev, [key]: value }));
    setQuantity(1);
  }

  const { addToCart } = useCart();

  function handleAddToCart() {
    if (!selectedVariant) return;
    addToCart({
      shopId: product.shop.id,
      variantId: selectedVariant.id,
      quantity,
      variant: {
        id: selectedVariant.id,
        name: selectedVariant.name,
        attributes: selectedVariant.attributes,
        price: selectedVariant.price,
        stock: selectedVariant.stock,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          currency: product.currency,
          status: "PUBLISHED",
          images: product.images,
        },
      },
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted">
            <Image
              src={images[activeImage].url}
              alt={`${product.name} — image ${activeImage + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <div className="absolute right-4 top-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-label={
                  isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"
                }
                aria-pressed={isWishlisted}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isWishlisted
                      ? "fill-primary text-primary"
                      : "text-muted-foreground",
                  )}
                />
              </button>
              <ShareButton title={product.name} url={productUrl} />
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                    activeImage === i ? "border-primary" : "border-transparent",
                  )}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            {product.brand && (
              <span className="text-sm text-muted-foreground">
                {product.brand}
              </span>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {product.name}
            </h1>
          </div>

          {/* Rating summary */}
          {product.rating && (
            <a
              href="#reviews"
              className="flex w-fit items-center gap-2 text-sm hover:underline"
            >
              <RatingStars rating={product.rating.average} />
              <span className="text-muted-foreground">
                {product.rating.average.toFixed(1)} ({product.rating.count}{" "}
                avis)
              </span>
            </a>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-3xl font-bold text-foreground">
              {selectedVariant
                ? formatPrice(Number(selectedVariant.price), product.currency)
                : "—"}
            </span>
            {selectedVariant && (
              <span
                className={cn(
                  "text-sm",
                  !inStock
                    ? "text-destructive"
                    : isLowStock
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {!inStock
                  ? "Rupture de stock"
                  : isLowStock
                    ? `Plus que ${selectedVariant.stock} en stock !`
                    : `En stock (${selectedVariant.stock} disponibles)`}
              </span>
            )}
          </div>

          {/* Purchase count */}
          {product.purchaseCount !== undefined && product.purchaseCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {product.purchaseCount} personne
              {product.purchaseCount > 1 ? "s" : ""} ont acheté ce produit
            </p>
          )}

          {/* Attribute pickers */}
          {attributeKeys.map((key) => (
            <div key={key} className="flex flex-col gap-2">
              <span className="text-sm font-medium capitalize text-foreground">
                {key}
              </span>
              <div className="flex flex-wrap gap-2">
                {attributeOptions[key].map((value) => {
                  const isSelected = selection[key] === value;
                  const wouldMatch = findMatchingVariant(product.variants, {
                    ...selection,
                    [key]: value,
                  });
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleAttributeSelect(key, value)}
                      disabled={!wouldMatch}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:border-primary",
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              Quantité
            </span>
            <div className="flex w-fit items-center gap-1 rounded-full border border-border">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuer la quantité"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium text-foreground tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                aria-label="Augmenter la quantité"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Button
            id="main-add-to-cart"
            size="lg"
            disabled={!inStock}
            onClick={handleAddToCart}
            className="w-full sm:w-auto"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {inStock ? "Ajouter au panier" : "Indisponible"}
          </Button>

          {/* Product details: weight, expiry, SKU */}
          {(product.weightGrams ||
            product.expiresAt ||
            selectedVariant?.sku) && (
            <dl className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
              {product.weightGrams && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Poids</dt>
                  <dd className="text-foreground">
                    {formatWeight(product.weightGrams)}
                  </dd>
                </div>
              )}
              {product.expiresAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">À consommer avant</dt>
                  <dd className="text-foreground">
                    {formatExpiry(product.expiresAt)}
                  </dd>
                </div>
              )}
              {selectedVariant?.sku && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Référence</dt>
                  <dd className="text-foreground">{selectedVariant.sku}</dd>
                </div>
              )}
            </dl>
          )}

          {/* Description */}
          <div className="flex flex-col gap-2 border-t border-border pt-6">
            <h2 className="text-sm font-semibold text-foreground">
              Description
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      <ProductReviews
        reviews={product.reviews ?? []}
        averageRating={product.rating?.average ?? 0}
        totalCount={product.rating?.count ?? 0}
        onSubmit={handleReviewSubmit}
      />

      {/* Sticky mobile add-to-cart bar */}
      {showStickyBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background p-4 shadow-lg lg:hidden">
          <div className="flex items-center gap-3">
            <span className="flex-1 truncate text-base font-bold text-foreground">
              {selectedVariant
                ? formatPrice(Number(selectedVariant.price), product.currency)
                : "—"}
            </span>
            <Button disabled={!inStock} onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {inStock ? "Ajouter" : "Indisponible"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
