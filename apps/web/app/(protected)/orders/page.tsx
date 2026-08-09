"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Package, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ordersApi,
  type Order,
  type OrderStatus,
} from "@/lib/api/routes/orders";
import { ApiException } from "@/lib/api";
import {
  ORDER_STATUS_LABELS,
  TERMINAL_ORDER_STATUSES,
  orderStatusBadgeVariant,
  formatOrderPrice,
  formatOrderDate,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

type Filter = "all" | "active" | "past";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "active", label: "En cours" },
  { value: "past", label: "Terminées" },
];

function matchesFilter(status: OrderStatus, filter: Filter) {
  if (filter === "all") return true;
  const isTerminal = TERMINAL_ORDER_STATUSES.includes(status);
  return filter === "past" ? isTerminal : !isTerminal;
}

function OrderRow({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40 sm:p-5"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
        <Package className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {order.shop?.name ?? "Boutique"}
          </p>
          <Badge variant={orderStatusBadgeVariant(order.status)}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatOrderDate(order.createdAt)} · {itemCount} article
          {itemCount > 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-semibold text-foreground">
          {formatOrderPrice(Number(order.total), order.currency)}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

function OrderRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border p-4 sm:p-5">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-4 w-16 shrink-0 animate-pulse rounded bg-muted" />
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ordersApi
      .listOrders({ page: 1 })
      .then((result) => {
        setOrders(result.orders);
        setPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setTotal(result.pagination.total);
      })
      .catch((err) => {
        setError(
          err instanceof ApiException
            ? err.message
            : "Impossible de charger vos commandes.",
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  const hasMore = page < totalPages;

  // Same "sentinel + IntersectionObserver" infinite-scroll pattern as
  // InfiniteProductGrid — kept independent of the active filter tab so
  // scrolling still pulls in more pages even while a tab hides some of
  // what's already loaded.
  const loadNextPage = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const result = await ordersApi.listOrders({ page: page + 1 });
      setOrders((prev) => [...prev, ...result.orders]);
      setPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error("[OrdersPage] Failed to load more orders:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, page]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadNextPage();
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadNextPage]);

  const filteredOrders = orders.filter((o) => matchesFilter(o.status, filter));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Mes commandes
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Chargement..."
            : `${total} commande${total > 1 ? "s" : ""}`}
        </p>
      </div>

      {!isLoading && orders.length > 0 && (
        <div className="mb-6 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                filter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:border-primary",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-20 text-center">
          <XCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-medium text-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Aucune commande pour le moment
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Vos commandes apparaîtront ici dès que vous aurez passé votre
            première commande.
          </p>
          <Button render={<Link href="/products" />} nativeButton={false}>
            Découvrir les produits
          </Button>
        </div>
      ) : (
        <>
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                Aucune commande dans cette catégorie
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </div>
          )}

          {hasMore && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}

          {isLoadingMore && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de plus de commandes...
            </div>
          )}

          {!hasMore && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Vous avez vu toutes vos commandes.
            </p>
          )}
        </>
      )}
    </div>
  );
}
