"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  downloadAccountantReportCsv,
  downloadAccountantReportPdf,
  emailAccountantReportToAdmins,
  getAccountantReport,
  getDefaultReportPeriod,
  triggerBrowserDownload,
  type AccountantReport,
} from "@/lib/api/routes/accountant";
import { getErrorMessage } from "@/lib/get-error-message";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ui } from "@/lib/i18n/common";

function formatCurrencySummary(
  totals: { currency: string; total: number | string; count: number }[],
) {
  if (!totals.length) return "—";
  return totals
    .map((row) => `${row.total} ${row.currency} (${row.count})`)
    .join(" · ");
}

export function AccountantReportPanel({
  onReportSaved,
}: {
  onReportSaved?: () => void;
}) {
  const defaults = getDefaultReportPeriod();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [report, setReport] = useState<AccountantReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

  async function loadPreview() {
    setIsLoading(true);
    setError(null);
    try {
      setReport(await getAccountantReport({ from, to }));
    } catch (err) {
      setError(
        getErrorMessage(err, "Impossible de charger l'aperçu du rapport."),
      );
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownloadCsv() {
    setIsDownloadingCsv(true);
    try {
      const { blob, filename } = await downloadAccountantReportCsv({
        from,
        to,
      });
      triggerBrowserDownload(blob, filename);
      showSuccessToast("CSV téléchargé", filename);
      onReportSaved?.();
    } catch (err) {
      showErrorToast(
        "Échec du téléchargement",
        getErrorMessage(err, "Impossible de générer le CSV."),
      );
    } finally {
      setIsDownloadingCsv(false);
    }
  }

  useEffect(() => {
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const { blob, filename } = await downloadAccountantReportPdf({
        from,
        to,
      });
      triggerBrowserDownload(blob, filename);
      showSuccessToast("PDF téléchargé", filename);
      onReportSaved?.();
    } catch (err) {
      showErrorToast(
        "Échec du téléchargement",
        getErrorMessage(err, "Impossible de générer le PDF."),
      );
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleSendEmail() {
    setIsSending(true);
    try {
      const result = await emailAccountantReportToAdmins({ from, to });
      showSuccessToast(
        "Rapport envoyé",
        `Envoyé à ${result.recipients.join(", ")}`,
      );
      onReportSaved?.();
    } catch (err) {
      showErrorToast(
        "Échec de l'envoi",
        getErrorMessage(err, "Impossible d'envoyer le rapport par e-mail."),
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Rapport comptable</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Générez un rapport PDF complet (abonnements, commandes, documents,
          paiements sortants admin et retraits vendeurs), téléchargez-le ou
          envoyez-le aux administrateurs par e-mail.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Période</label>
            <DateRangePicker
              from={from}
              to={to}
              onChange={({ from: nextFrom, to: nextTo }) => {
                setFrom(nextFrom);
                setTo(nextTo);
              }}
            />
          </div>
          <Button type="button" variant="outline" onClick={loadPreview}>
            <RefreshCw className="h-4 w-4" />
            Actualiser l&apos;aperçu
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Génération…" : "Télécharger le PDF"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadCsv}
            disabled={isDownloadingCsv}
          >
            <FileSpreadsheet className="h-4 w-4" />
            {isDownloadingCsv ? "Génération…" : "Télécharger le CSV"}
          </Button>
          <Button type="button" onClick={handleSendEmail} disabled={isSending}>
            <Mail className="h-4 w-4" />
            {isSending ? "Envoi…" : "Envoyer aux admins"}
          </Button>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : report ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">Référence</p>
              <p className="font-medium">{report.reference}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">
                Abonnements encaissés
              </p>
              <p className="text-sm">
                {formatCurrencySummary(report.summary.subscriptionRevenue)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">
                Paiements commandes
              </p>
              <p className="text-sm">
                {formatCurrencySummary(report.summary.orderPayments)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">GMV complétée</p>
              <p className="text-sm">
                {formatCurrencySummary(report.summary.orderGmv)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">Documents émis</p>
              <p className="text-sm">{report.summary.invoices.total}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">
                Paiements sortants admin
              </p>
              <p className="text-sm">
                {report.summary.adminPayouts.count} ·{" "}
                {formatCurrencySummary(report.summary.adminPayouts.totals)}
              </p>
            </div>
            <div className="rounded-lg border p-3 md:col-span-2">
              <p className="text-muted-foreground text-xs">Retraits vendeurs</p>
              <p className="text-sm">
                {report.summary.sellerPayouts.count} ·{" "}
                {formatCurrencySummary(report.summary.sellerPayouts.totals)}
              </p>
            </div>
            <div className="rounded-lg border p-3 md:col-span-2">
              <p className="text-muted-foreground text-xs">
                Dépenses SwiftGoma
              </p>
              <p className="text-sm">
                {report.summary.companyExpenses.count} ·{" "}
                {report.summary.companyExpenses.pending} en attente ·{" "}
                {formatCurrencySummary(report.summary.companyExpenses.totals)}
              </p>
            </div>
            {report.truncated && (
              <p className="text-muted-foreground md:col-span-2 text-xs">
                Le PDF inclut jusqu&apos;à 100 lignes par section pour la
                période sélectionnée.
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{ui.noResults}</p>
        )}
      </CardContent>
    </Card>
  );
}
