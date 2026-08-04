"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  publicApi,
  type ProductListItem,
  type ProductListParams,
} from "@/lib/api/routes/public";
import { mapProductToCardData } from "@/lib/api/routes/products";
import { FeaturedProductCard } from "@/components/products/product-card";
import { ProductCardSkeleton } from "./product-card-skeleton";

type FetchPage = (
  params: ProductListParams,
) => Promise<{
  products: ProductListItem[];
  pagination: { page: number; totalPages: number };
}>;

type InfiniteProductGridProps = {
  initialProducts: ProductListItem[];
  initialPage: number;
  initialTotalPages: number;
  filters: Omit<ProductListParams, "page">;
  fetchPage?: FetchPage;
};

export function InfiniteProductGrid({
  initialProducts,
  initialPage,
  initialTotalPages,
  filters,
  fetchPage = publicApi.listProducts,
}: InfiniteProductGridProps) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = page < totalPages;

  const loadNextPage = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const result = await fetchPage({
        ...filters,
        page: nextPage,
      });
      setProducts((prev) => [...prev, ...result.products]);
      setPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error("[InfiniteProductGrid] Failed to load more products:", err);
      // Stay on the current page — the sentinel remains visible so the
      // user can scroll again / it'll retry on next intersection.
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, filters, hasMore, isLoadingMore, page]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextPage();
        }
      },
      { rootMargin: "400px" }, // start fetching before the sentinel is actually on screen
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadNextPage]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <FeaturedProductCard
            key={product.id}
            product={mapProductToCardData(product)}
            size="sm"
            className="max-w-none"
          />
        ))}

        {isLoadingMore &&
          Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={`loading-${i}`} />
          ))}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}

      {isLoadingMore && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement de plus de produits...
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Vous avez vu tous les produits disponibles.
        </p>
      )}
    </div>
  );
}
