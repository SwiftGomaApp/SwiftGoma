"use client";

import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
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
  downloadStoredAccountantReportPdf,
  getAccountantReportHistory,
  triggerBrowserDownload,
  type AccountantReportHistoryResponse,
  type AccountantReportSource,
  type StoredAccountantReport,
} from "@/lib/api/routes/accountant";
import { formatDate, formatDateTime } from "@/lib/i18n/format";
import { getErrorMessage } from "@/lib/get-error-message";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";

const sourceLabels: Record<AccountantReportSource, string> = {
  DOWNLOAD: "Téléchargement",
  EMAIL: "E-mail",
  SCHEDULED: "Automatique",
};

const sourceVariants: Record<
  AccountantReportSource,
  "default" | "secondary" | "outline"
> = {
  DOWNLOAD: "outline",
  EMAIL: "default",
  SCHEDULED: "secondary",
};

function formatPeriod(item: StoredAccountantReport) {
  return `${formatDate(item.period.from)} → ${formatDate(item.period.to)}`;
}

interface AccountantReportHistoryPanelProps {
  refreshKey?: number;
}

export function AccountantReportHistoryPanel({
  refreshKey = 0,
}: AccountantReportHistoryPanelProps) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AccountantReportHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getAccountantReportHistory({ page, limit: 10 }));
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger l'historique."));
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function handleDownload(id: string) {
    setDownloadingId(id);
    try {
      const { blob, filename } = await downloadStoredAccountantReportPdf(id);
      triggerBrowserDownload(blob, filename);
      showSuccessToast("PDF téléchargé", filename);
    } catch (err) {
      showErrorToast(
        "Échec du téléchargement",
        getErrorMessage(err, "Impossible de télécharger le rapport."),
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Historique des rapports</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Chaque téléchargement, envoi par e-mail ou rapport mensuel automatique
          est archivé ici avec son PDF.
        </p>

        {error && <p className="text-destructive text-sm">{error}</p>}

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun rapport archivé pour le moment.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Généré par</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead>Destinataires</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(item.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatPeriod(item)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.reference}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.generatedBy?.name ?? item.generatedByLabel}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sourceVariants[item.source]}>
                        {sourceLabels[item.source]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">
                      {item.recipients.length > 0
                        ? item.recipients.join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={downloadingId === item.id}
                        onClick={() => handleDownload(item.id)}
                      >
                        <Download className="h-4 w-4" />
                        {downloadingId === item.id ? "…" : "PDF"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs">
                  Page {data.page} sur {data.totalPages} · {data.total} rapport
                  {data.total > 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Précédent
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((current) => current + 1)}
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
