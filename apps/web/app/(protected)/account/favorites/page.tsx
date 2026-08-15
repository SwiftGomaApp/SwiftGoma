"use client";

import { useEffect, useState } from "react";
import { Heart, Sparkles } from "lucide-react";
import Link from "next/link";
import { favoritesApi } from "@/lib/api/routes/favorites";
import type { ProductListResponse } from "@/lib/api/routes/public";
import { InfiniteProductGrid } from "@/components/products/infinite-product-grid";
import { ProductCardSkeleton } from "@/components/products/product-card-skeleton";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const [result, setResult] = useState<ProductListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    favoritesApi
      .list({ page: 1 })
      .then(setResult)
      .catch(() =>
        setResult({
          products: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
        }),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const count = result?.pagination.total ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Heart className="h-5 w-5 fill-primary text-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Favoris
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Chargement..."
                : count > 0
                  ? `${count} produit${count > 1 ? "s" : ""} enregistré${count > 1 ? "s" : ""}`
                  : "Rien enregistré pour l'instant"}
            </p>
          </div>
        </div>

        {!isLoading && count > 0 && (
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/products" />}
            nativeButton={false}
          >
            Continuer mes achats
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : !result || result.products.length === 0 ? (
        <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-24 text-center">
          <Sparkles className="absolute right-8 top-8 h-5 w-5 text-muted-foreground/30" />
          <Sparkles className="absolute left-10 bottom-10 h-4 w-4 text-muted-foreground/20" />

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
            <Heart className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-semibold text-foreground">
              Aucun favori pour le moment
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Parcourez les produits et appuyez sur le cœur pour les retrouver
              ici facilement.
            </p>
          </div>
          <Button
            render={<Link href="/products" />}
            nativeButton={false}
            className="mt-2"
          >
            Découvrir les produits
          </Button>
        </div>
      ) : (
        <InfiniteProductGrid
          initialProducts={result.products}
          initialPage={result.pagination.page}
          initialTotalPages={result.pagination.totalPages}
          filters={{}}
          fetchPage={favoritesApi.list}
        />
      )}
    </div>
  );
}
