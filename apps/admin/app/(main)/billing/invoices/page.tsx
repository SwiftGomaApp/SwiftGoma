"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
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
  listAdminInvoices,
  type AdminInvoiceRecord,
} from "@/lib/api/routes/billing";
import { getErrorMessage } from "@/lib/get-error-message";
import { formatDateTime } from "@/lib/i18n/format";
import { labelOf } from "@/lib/i18n/labels";

const documentTypeLabels: Record<string, string> = {
  INVOICE: "Facture",
  RECEIPT: "Reçu",
  PAYOUT_RECEIPT: "Reçu de payout",
};

export default function BillingInvoicesPage() {
  const [items, setItems] = useState<AdminInvoiceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAdminInvoices({
        page,
        limit: 20,
        type: typeFilter || undefined,
        search,
      });
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les documents."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on filter/page change
  }, [page, search, typeFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Documents de facturation</h1>
        <p className="text-muted-foreground text-sm">
          Parcourir et télécharger les factures et reçus émis pour les vendeurs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 lg:flex-row"
          >
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Numéro de document ou entreprise…"
              className="lg:flex-1"
            />
            <div className="flex flex-wrap gap-2">
              <NativeSelect
                value={typeFilter}
                onChange={(e) => {
                  setPage(1);
                  setTypeFilter(e.target.value);
                }}
                className="min-w-36"
              >
                <NativeSelectOption value="">Tous les types</NativeSelectOption>
                <NativeSelectOption value="INVOICE">Factures</NativeSelectOption>
                <NativeSelectOption value="RECEIPT">Reçus</NativeSelectOption>
                <NativeSelectOption value="PAYOUT_RECEIPT">Reçus payout</NativeSelectOption>
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
          <CardTitle className="text-sm">Documents</CardTitle>
          {!isLoading && (
            <p className="text-muted-foreground text-xs">{total} au total</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && <p className="text-destructive text-sm">{error}</p>}

          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun document trouvé.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Émis le</TableHead>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Vendeur</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="text-sm">
                        {formatDateTime(invoice.issuedAt)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {invoice.documentNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {labelOf(documentTypeLabels, invoice.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {invoice.sellerProfile.businessName}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={
                            <a
                              href={invoice.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ouvrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-muted-foreground text-sm">
                    Page {page} sur {totalPages}
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
                      disabled={page >= totalPages}
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
