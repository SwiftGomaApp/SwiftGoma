"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import { TransactionResultCard } from "@/components/admin/transaction-result-card";
import { PaymentLedgerPanel } from "@/components/admin/payment-ledger-panel";
import {
  getAdminTransactions,
  getMbiyoPayTransactionStatus,
  getPawaPayPayoutStatus,
  type AdminPayoutHistoryResponse,
  type AdminPayoutRecord,
} from "@/lib/api/routes/payments";
import { formatDateTime } from "@/lib/i18n/format";
import { getErrorMessage } from "@/lib/get-error-message";

const statusLabels: Record<AdminPayoutRecord["status"], string> = {
  PROCESSING: "En cours",
  COMPLETED: "Terminé",
  FAILED: "Échoué",
};

const statusVariants: Record<
  AdminPayoutRecord["status"],
  "default" | "secondary" | "destructive"
> = {
  PROCESSING: "secondary",
  COMPLETED: "default",
  FAILED: "destructive",
};

const providerLabels: Record<AdminPayoutRecord["provider"], string> = {
  PAWAPAY: "PawaPay",
  MBIYOPAY: "MbiyoPay",
};

export function AdminTransactionsPage() {
  const [view, setView] = useState<"payouts" | "ledger">("payouts");
  const [page, setPage] = useState(1);
  const [provider, setProvider] = useState<"" | "PAWAPAY" | "MBIYOPAY">("");
  const [status, setStatus] = useState<"" | AdminPayoutRecord["status"]>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AdminPayoutHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<unknown>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusTitle, setStatusTitle] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminTransactions({
        page,
        limit: 20,
        provider,
        status,
        search,
      });
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les transactions."));
    } finally {
      setIsLoading(false);
    }
  }, [page, provider, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function handleVerifyStatus(item: AdminPayoutRecord) {
    if (!item.externalId) return;

    setCheckingId(item.id);
    setStatusError(null);
    setStatusResult(null);
    setStatusTitle(
      `${providerLabels[item.provider]} · ${item.externalId}`,
    );

    try {
      const result =
        item.provider === "PAWAPAY"
          ? await getPawaPayPayoutStatus(item.externalId)
          : await getMbiyoPayTransactionStatus(item.externalId);
      setStatusResult(result);
    } catch (err) {
      setStatusError(getErrorMessage(err, "La vérification a échoué."));
    } finally {
      setCheckingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Historique des transactions</h1>
        <p className="text-muted-foreground text-sm">
          Paiements sortants admin et grand livre unifié (abonnements, commandes,
          dépenses).
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant={view === "payouts" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("payouts")}
          >
            Paiements sortants
          </Button>
          <Button
            type="button"
            variant={view === "ledger" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("ledger")}
          >
            Grand livre unifié
          </Button>
        </div>
      </div>

      {view === "ledger" ? (
        <PaymentLedgerPanel />
      ) : (
        <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 lg:flex-row"
          >
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par bénéficiaire, téléphone ou référence…"
              className="lg:flex-1"
            />
            <div className="flex flex-wrap gap-2">
              <NativeSelect
                value={provider}
                onChange={(e) => {
                  setPage(1);
                  setProvider(e.target.value as typeof provider);
                }}
                className="min-w-36"
              >
                <NativeSelectOption value="">Tous les prestataires</NativeSelectOption>
                <NativeSelectOption value="PAWAPAY">PawaPay</NativeSelectOption>
                <NativeSelectOption value="MBIYOPAY">MbiyoPay</NativeSelectOption>
              </NativeSelect>
              <NativeSelect
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as typeof status);
                }}
                className="min-w-36"
              >
                <NativeSelectOption value="">Tous les statuts</NativeSelectOption>
                <NativeSelectOption value="PROCESSING">En cours</NativeSelectOption>
                <NativeSelectOption value="COMPLETED">Terminé</NativeSelectOption>
                <NativeSelectOption value="FAILED">Échoué</NativeSelectOption>
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
          <CardTitle className="text-sm">Transactions</CardTitle>
          {data && (
            <p className="text-muted-foreground text-xs">
              {data.total} au total
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && <p className="text-destructive text-sm">{error}</p>}

          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !data || data.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune transaction trouvée.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Prestataire</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {providerLabels[item.provider]}
                      </TableCell>
                      <TableCell className="text-sm">{item.admin.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {item.amount} {item.currency}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{item.beneficiary || "—"}</div>
                        {item.phoneNumber && (
                          <div className="text-muted-foreground text-xs">
                            {item.phoneNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-40 font-mono text-xs break-all">
                        {item.externalId || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[item.status]}>
                          {statusLabels[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!item.externalId || checkingId === item.id}
                          onClick={() => handleVerifyStatus(item)}
                        >
                          {checkingId === item.id ? "…" : "Statut live"}
                        </Button>
                      </TableCell>
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

      {statusError && <p className="text-destructive text-sm">{statusError}</p>}
      {statusResult !== null && statusTitle && (
        <TransactionResultCard title={statusTitle} data={statusResult} />
      )}

      <p className="text-muted-foreground text-sm">
        Besoin de vérifier un dépôt ou un remboursement PawaPay ? Utilisez les
        pages{" "}
        <Link href="/payments/pawapay" className="text-primary underline-offset-4 hover:underline">
          PawaPay
        </Link>{" "}
        ou{" "}
        <Link href="/payments/mbiyopay" className="text-primary underline-offset-4 hover:underline">
          MbiyoPay
        </Link>
        .
      </p>
        </>
      )}
    </div>
  );
}
