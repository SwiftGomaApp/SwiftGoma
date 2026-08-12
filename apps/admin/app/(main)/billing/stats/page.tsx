"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { getInvoiceStats, type InvoiceStats } from "@/lib/api/routes/billing";
import { AccountantReportPanel } from "@/components/admin/accountant-report-panel";
import { AccountantReportHistoryPanel } from "@/components/admin/accountant-report-history-panel";
import { ApiError } from "@/lib/api/client";
import { labelOf } from "@/lib/i18n/labels";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

const documentTypeLabels: Record<string, string> = {
  INVOICE: "Facture",
  RECEIPT: "Reçu",
};

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function BillingStatsPage() {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportHistoryKey, setReportHistoryKey] = useState(0);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        setStats(await getInvoiceStats());
      } catch (err) {
        setError(getErrorMessage(err, "Impossible de charger les statistiques de facturation."));
      } finally {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return <p className="text-destructive text-sm">{error ?? "Aucune donnée."}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Statistiques de facturation</h1>
        <p className="text-muted-foreground text-sm">
          Factures et reçus générés sur la marketplace.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Documents au total" value={stats.totalDocuments} />
        <StatCard title="Factures" value={stats.byType.INVOICE} />
        <StatCard title="Reçus" value={stats.byType.RECEIPT} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">6 derniers mois</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.byMonth.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun document pour l&apos;instant.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mois</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Nombre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.byMonth.map((row, i) => (
                  <TableRow key={`${row.month}-${row.type}-${i}`}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell>{labelOf(documentTypeLabels, row.type)}</TableCell>
                    <TableCell>{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AccountantReportPanel
        onReportSaved={() => setReportHistoryKey((key) => key + 1)}
      />
      <AccountantReportHistoryPanel refreshKey={reportHistoryKey} />
    </div>
  );
}
