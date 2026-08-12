"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  listShopsAdmin,
  suspendShop,
  reactivateShop,
  adminDeleteShop,
  restoreShop,
  type ShopListItem,
  type ShopStatus,
} from "@/lib/api/routes/sellers";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/i18n/format";
import { labelOf, shopStatusLabels } from "@/lib/i18n/labels";
import { ui } from "@/lib/i18n/common";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

function statusVariant(status: ShopStatus): "default" | "secondary" | "destructive" {
  if (status === "PUBLISHED") return "default";
  if (status === "SUSPENDED") return "destructive";
  return "secondary";
}

const STATUSES: ShopStatus[] = ["DRAFT", "PUBLISHED", "SUSPENDED"];

export default function ShopsPage() {
  const [shops, setShops] = useState<ShopListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<ShopStatus | "">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listShopsAdmin({
        page,
        status: status || undefined,
        search: search || undefined,
      });
      setShops(result.shops);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les boutiques."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch on filter/page change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, search]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function runRowAction(id: string, action: () => Promise<unknown>) {
    setActingId(id);
    setRowError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setRowError(getErrorMessage(err, "Cette action a échoué."));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Boutiques</h1>
        <p className="text-muted-foreground text-sm">
          {isLoading
            ? ui.loading
            : `${total} boutique${total === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher une boutique…"
            className="pl-8"
          />
        </form>
        <NativeSelect
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as ShopStatus | "");
          }}
          className="w-40"
        >
          <NativeSelectOption value="">{ui.allStatuses}</NativeSelectOption>
          {STATUSES.map((s) => (
            <NativeSelectOption key={s} value={s}>
              {labelOf(shopStatusLabels, s)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {rowError && <p className="text-destructive text-sm">{rowError}</p>}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucune boutique trouvée.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Boutique</TableHead>
                <TableHead>Vendeur</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>{ui.status}</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead className="text-right">{ui.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell className="text-sm">
                    {shop.sellerProfile.businessName}
                  </TableCell>
                  <TableCell className="text-sm">{shop._count.products}</TableCell>
                  <TableCell>
                    {shop.deletedAt ? (
                      <Badge variant="destructive">Supprimée</Badge>
                    ) : (
                      <Badge variant={statusVariant(shop.status)}>
                        {labelOf(shopStatusLabels, shop.status)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {shop.createdAt ? formatDate(shop.createdAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {shop.deletedAt ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actingId === shop.id}
                        onClick={() =>
                          runRowAction(shop.id, () => restoreShop(shop.id))
                        }
                      >
                        Restaurer
                      </Button>
                    ) : shop.status === "SUSPENDED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actingId === shop.id}
                        onClick={() =>
                          runRowAction(shop.id, () => reactivateShop(shop.id))
                        }
                      >
                        Réactiver
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actingId === shop.id}
                        onClick={() => {
                          if (!confirm(`Suspendre « ${shop.name} » ?`)) return;
                          runRowAction(shop.id, () => suspendShop(shop.id));
                        }}
                      >
                        Suspendre
                      </Button>
                    )}{" "}
                    {!shop.deletedAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actingId === shop.id}
                        onClick={() => {
                          if (
                            !confirm(
                              `Supprimer « ${shop.name} » ? Cette action peut être annulée ultérieurement.`,
                            )
                          )
                            return;
                          runRowAction(shop.id, () => adminDeleteShop(shop.id));
                        }}
                      >
                        {ui.delete}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              {ui.pageOf(page, totalPages)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {ui.previous}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {ui.next}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
