"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
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

interface AdminPayoutHistoryPanelProps {
  title?: string;
  fetchHistory: (params: { page: number; limit: number }) => Promise<AdminPayoutHistoryResponse>;
  refreshKey?: number;
}

export function AdminPayoutHistoryPanel({
  title = "Historique des paiements sortants",
  fetchHistory,
  refreshKey = 0,
}: AdminPayoutHistoryPanelProps) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminPayoutHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchHistory({ page, limit: 10 });
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger l'historique."));
    } finally {
      setIsLoading(false);
    }
  }, [fetchHistory, page]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
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
            Aucun paiement sortant initié par un administrateur pour le moment.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(item.createdAt)}
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
                          {item.network ? ` · ${item.network}` : ""}
                          {item.providerName ? ` · ${item.providerName}` : ""}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.externalId || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[item.status]}>
                        {statusLabels[item.status]}
                      </Badge>
                      {item.externalStatus && (
                        <div className="text-muted-foreground mt-1 text-xs">
                          {item.externalStatus}
                        </div>
                      )}
                      {item.failureReason && (
                        <div className="text-destructive mt-1 text-xs">
                          {item.failureReason}
                        </div>
                      )}
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
  );
}
