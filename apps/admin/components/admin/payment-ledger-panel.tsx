"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  getPaymentLedger,
  type PaymentLedgerEntry,
  type PaymentLedgerResponse,
  type PaymentLedgerSource,
} from "@/lib/api/routes/payments";
import { formatDateTime } from "@/lib/i18n/format";
import { getErrorMessage } from "@/lib/get-error-message";
import { labelOf } from "@/lib/i18n/labels";

const sourceLabels: Record<PaymentLedgerSource, string> = {
  ADMIN_PAYOUT: "Paiement sortant",
  SUBSCRIPTION_PAYMENT: "Abonnement",
  ORDER_PAYMENT: "Commande",
  EXPENSE: "Dépense",
};

const directionLabels = {
  IN: "Entrée",
  OUT: "Sortie",
};

export function PaymentLedgerPanel() {
  const [page, setPage] = useState(1);
  const [source, setSource] = useState<"" | PaymentLedgerSource>("");
  const [direction, setDirection] = useState<"" | "IN" | "OUT">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<PaymentLedgerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPaymentLedger({
        page,
        limit: 20,
        source,
        direction,
        search,
      });
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger le grand livre."));
    } finally {
      setIsLoading(false);
    }
  }, [direction, page, search, source]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filtres du grand livre</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 lg:flex-row"
          >
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Référence, libellé, vendeur…"
              className="lg:flex-1"
            />
            <div className="flex flex-wrap gap-2">
              <NativeSelect
                value={source}
                onChange={(e) => {
                  setPage(1);
                  setSource(e.target.value as typeof source);
                }}
                className="min-w-40"
              >
                <NativeSelectOption value="">Toutes les sources</NativeSelectOption>
                {Object.entries(sourceLabels).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                value={direction}
                onChange={(e) => {
                  setPage(1);
                  setDirection(e.target.value as typeof direction);
                }}
                className="min-w-32"
              >
                <NativeSelectOption value="">Entrées et sorties</NativeSelectOption>
                <NativeSelectOption value="IN">Entrées</NativeSelectOption>
                <NativeSelectOption value="OUT">Sorties</NativeSelectOption>
              </NativeSelect>
              <Button type="submit" variant="outline">
                <Search className="h-4 w-4" />
                Rechercher
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Grand livre unifié</CardTitle>
          {data && (
            <p className="text-muted-foreground text-xs">{data.total} mouvements</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && <p className="text-destructive text-sm">{error}</p>}

          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !data || data.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun mouvement trouvé.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Sens</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item: PaymentLedgerEntry) => (
                    <TableRow key={`${item.source}-${item.id}`}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {labelOf(sourceLabels, item.source)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.direction === "IN" ? "default" : "secondary"}>
                          {directionLabels[item.direction]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-sm">
                        {item.label}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {item.amount} {item.currency}
                      </TableCell>
                      <TableCell className="max-w-36 font-mono text-xs break-all">
                        {item.reference}
                      </TableCell>
                      <TableCell className="text-sm">{item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.totalPages > 1 && (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-muted-foreground text-sm">
                    Page {data.page} sur {data.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Précédent
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
