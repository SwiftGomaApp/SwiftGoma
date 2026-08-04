"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
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
      .catch(() => setResult({ products: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Favoris
        </h1>
        <p className="text-sm text-muted-foreground">
          {result
            ? `${result.pagination.total} produit${result.pagination.total > 1 ? "s" : ""} enregistré${result.pagination.total > 1 ? "s" : ""}`
            : "Chargement..."}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : !result || result.products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Heart className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Aucun favori pour le moment
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Parcourez les produits et appuyez sur le cœur pour les enregistrer
            ici.
          </p>
          <Button render={<Link href="/products" />} nativeButton={false}>
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
