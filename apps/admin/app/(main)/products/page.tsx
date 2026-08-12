"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listAdminProducts,
  getAdminProduct,
  moderateAdminProduct,
  type AdminProductSummary,
  type ProductStatus,
} from "@/lib/api/routes/products";
import { getErrorMessage } from "@/lib/get-error-message";
import { formatDateTime } from "@/lib/i18n/format";
import { labelOf, productStatusLabels } from "@/lib/i18n/labels";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ui } from "@/lib/i18n/common";

const STATUSES: ProductStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export default function ProductsPage() {
  const [items, setItems] = useState<AdminProductSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminProductSummary | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [isActing, setIsActing] = useState(false);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAdminProducts({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les produits."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, search]);

  async function openDetail(id: string) {
    setDetailId(id);
    setDetail(null);
    setDetailError(null);
    setReason("");
    setDetailLoading(true);
    try {
      setDetail(await getAdminProduct(id));
    } catch (err) {
      setDetailError(getErrorMessage(err, "Impossible de charger le produit."));
    } finally {
      setDetailLoading(false);
    }
  }

  async function moderate(status: "ARCHIVED" | "DRAFT") {
    if (!detailId) return;
    setIsActing(true);
    try {
      await moderateAdminProduct(detailId, {
        status,
        reason: reason.trim() || undefined,
      });
      showSuccessToast(
        status === "ARCHIVED" ? "Produit retiré" : "Produit en brouillon",
        detail?.name ?? "",
      );
      setDetail(await getAdminProduct(detailId));
      await load();
    } catch (err) {
      showErrorToast("Échec", getErrorMessage(err, "Action impossible."));
    } finally {
      setIsActing(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Produits</h1>
        <p className="text-muted-foreground text-sm">
          {isLoading ? ui.loading : `${total} produit${total === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nom, slug, boutique…"
            className="pl-8"
          />
        </form>
        <NativeSelect
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as ProductStatus | "");
          }}
          className="w-44"
        >
          <NativeSelectOption value="">Tous les statuts</NativeSelectOption>
          {STATUSES.map((s) => (
            <NativeSelectOption key={s} value={s}>
              {labelOf(productStatusLabels, s)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Boutique</TableHead>
              <TableHead>Prix min</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Mis à jour</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  Aucun produit trouvé.
                </TableCell>
              </TableRow>
            ) : (
              items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="text-sm font-medium">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-sm">{product.shop.name}</TableCell>
                  <TableCell className="text-sm">
                    {product.minPrice != null
                      ? `${product.minPrice} ${product.currency}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {labelOf(productStatusLabels, product.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDateTime(product.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openDetail(product.id)}
                    >
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null);
            setDetail(null);
            setDetailError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modération produit</DialogTitle>
            <DialogDescription>
              {detail ? `${detail.name} · ${detail.shop.name}` : "Chargement…"}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : detailError ? (
            <p className="text-destructive text-sm">{detailError}</p>
          ) : detail ? (
            <div className="flex flex-col gap-4 py-2 text-sm">
              <Badge variant="outline">
                {labelOf(productStatusLabels, detail.status)}
              </Badge>
              {detail.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.imageUrl}
                  alt={detail.name}
                  className="h-32 w-32 rounded-md object-cover"
                />
              )}
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motif de modération (optionnel, notifié au vendeur)…"
                rows={3}
              />
              {detail.status === "PUBLISHED" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isActing}
                    onClick={() => moderate("ARCHIVED")}
                  >
                    Retirer de la vente
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isActing}
                    onClick={() => moderate("DRAFT")}
                  >
                    Repasser en brouillon
                  </Button>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailId(null)}>
              {ui.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
