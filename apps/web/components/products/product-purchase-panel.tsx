"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Heart, Loader2, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useCart } from "@/lib/cart/cart-context";
import { apiGet, apiPost, apiDelete } from "@/lib/api/client";
import type { Locale } from "@/lib/language";
import type { PublicProductDetail } from "@/lib/api/routes/products";
import {
  findVariantByAttributes,
  formatMoney,
  getDefaultVariant,
  getVariantAttributeAxes,
  getVariantOptionLabel,
} from "@/lib/products";

const STRINGS = {
  en: {
    inStock: "In stock",
    lowStockSuffix: "left",
    outOfStock: "Out of stock",
    addToCart: "Add to Cart",
    added: "Added",
    unavailable: "Currently unavailable",
    favoriteAdd: "Add to favorites",
    favoriteRemove: "Remove from favorites",
    signInToFavorite: "Sign in to save favorites",
    option: "Option",
  },
  fr: {
    inStock: "En stock",
    lowStockSuffix: "restant(s)",
    outOfStock: "Rupture de stock",
    addToCart: "Ajouter au panier",
    added: "Ajouté",
    unavailable: "Actuellement indisponible",
    favoriteAdd: "Ajouter aux favoris",
    favoriteRemove: "Retirer des favoris",
    signInToFavorite: "Connectez-vous pour enregistrer vos favoris",
    option: "Option",
  },
} as const;

export function ProductPurchasePanel({
  product,
  locale,
}: {
  product: PublicProductDetail;
  locale: Locale;
}) {
  const t = STRINGS[locale];
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const axes = useMemo(
    () => getVariantAttributeAxes(product.variants),
    [product.variants],
  );
  const defaultVariant = useMemo(
    () => getDefaultVariant(product.variants),
    [product.variants],
  );

  const [selected, setSelected] = useState<Record<string, string>>(
    () => (defaultVariant?.attributes as Record<string, string>) ?? {},
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    () => defaultVariant?.id ?? null,
  );

  const hasNamedOptions = axes.length === 0 && product.variants.length > 1;

  const activeVariant =
    axes.length > 0
      ? (findVariantByAttributes(product.variants, selected) ?? defaultVariant)
      : hasNamedOptions
        ? (product.variants.find((v) => v.id === selectedVariantId) ??
          defaultVariant)
        : defaultVariant;

  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsFavorited(false);
      return;
    }
    let cancelled = false;
    apiGet<string[]>("/favorites/ids")
      .then((ids) => {
        if (!cancelled) setIsFavorited(ids.includes(product.id));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, product.id]);

  async function toggleFavorite() {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    const next = !isFavorited;
    setIsFavorited(next);
    try {
      if (next) {
        await apiPost(`/favorites/${product.id}`);
      } else {
        await apiDelete(`/favorites/${product.id}`);
      }
    } catch {
      setIsFavorited(!next);
    } finally {
      setFavoriteLoading(false);
    }
  }

  const price = activeVariant ? Number.parseFloat(activeVariant.price) : null;
  const stock = activeVariant?.stock ?? 0;
  const inStock = stock > 0;

  async function handleAddToCart() {
    if (!activeVariant || !inStock) return;
    const added = await addItem(
      product.shop.id,
      activeVariant.id,
      1,
      product.name,
    );
    if (added) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline gap-3">
        {price != null ? (
          <span className="text-3xl font-semibold text-foreground">
            {formatMoney(price, product.currency)}
          </span>
        ) : (
          <span className="text-lg text-muted-foreground">{t.unavailable}</span>
        )}
      </div>

      {activeVariant && (
        <Badge
          variant={inStock ? "secondary" : "destructive"}
          className="w-fit"
        >
          {inStock
            ? stock <= 5
              ? `${stock} ${t.lowStockSuffix}`
              : t.inStock
            : t.outOfStock}
        </Badge>
      )}

      {axes.length > 0 && (
        <div className="flex flex-col gap-4">
          {axes.map((axis) => (
            <div key={axis.key} className="flex flex-col gap-2">
              <span className="text-sm font-medium capitalize text-foreground">
                {axis.key}
              </span>
              <div className="flex flex-wrap gap-2">
                {axis.values.map((value) => {
                  const isSelected = selected[axis.key] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setSelected((prev) => ({ ...prev, [axis.key]: value }))
                      }
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-sm transition-colors",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasNamedOptions && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            {t.option}
          </span>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const isSelected = selectedVariantId === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {getVariantOptionLabel(variant)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          disabled={!inStock}
          onClick={handleAddToCart}
          className="h-12 flex-1 gap-2 bg-primary text-background hover:bg-primary/85"
        >
          {justAdded ? (
            <Check className="size-4" />
          ) : (
            <ShoppingCart className="size-4" />
          )}
          {inStock ? (justAdded ? t.added : t.addToCart) : t.outOfStock}
        </Button>

        {!authLoading &&
          (isAuthenticated ? (
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label={isFavorited ? t.favoriteRemove : t.favoriteAdd}
              aria-pressed={isFavorited}
              disabled={favoriteLoading}
              onClick={toggleFavorite}
              className="shrink-0 border-border"
            >
              {favoriteLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Heart
                  className={cn(
                    "size-5 transition-colors",
                    isFavorited
                      ? "fill-primary text-primary"
                      : "fill-none text-muted-foreground",
                  )}
                />
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label={t.signInToFavorite}
              nativeButton={false}
              render={<Link href="/auth/sign-in" />}
              className="shrink-0 border-border"
            >
              <Heart className="size-5 text-muted-foreground" />
            </Button>
          ))}
      </div>
    </div>
  );
}

export default ProductPurchasePanel;
