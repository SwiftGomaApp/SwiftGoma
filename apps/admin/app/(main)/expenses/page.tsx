"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { useAuth } from "@/providers/auth-provider";
import { formatDate, formatDateTime } from "@/lib/i18n/format";
import { getErrorMessage } from "@/lib/get-error-message";
import { ExpenseFormDialog } from "@/components/admin/expense-form-dialog";
import { ExpenseApprovalActions } from "@/components/admin/expense-approval-actions";
import { ExpenseDetailDialog } from "@/components/admin/expense-detail-dialog";

import { triggerBrowserDownload } from "@/lib/api/routes/accountant";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";

import {
  exportExpensesCsv,
  listExpenses,
  type ExpenseRecord,
  type ExpenseStatus,
} from "@/lib/api/routes/expenses";

const STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDING: "En attente",
  REJECTED: "Rejetée",
  PROCESSING: "Paiement en cours",
  COMPLETED: "Payée",
  FAILED: "Échec",
};

const STATUS_VARIANTS: Record<
  ExpenseStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  REJECTED: "destructive",
  PROCESSING: "outline",
  COMPLETED: "default",
  FAILED: "destructive",
};

const CATEGORY_LABELS: Record<string, string> = {
  OPERATIONS: "Opérations",
  MARKETING: "Marketing",
  PAYROLL: "Paie",
  LEGAL: "Juridique",
  TRAVEL: "Déplacements",
  UTILITIES: "Services",
  EQUIPMENT: "Équipement",
  OTHER: "Autre",
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ExpenseRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(
    null,
  );

  const isAccountant = user?.role === "ACCOUNTANT";
  const isAdmin = user?.role === "ADMIN";

  const pendingCount = useMemo(
    () => items.filter((item) => item.status === "PENDING").length,
    [items],
  );

  async function loadExpenses() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listExpenses({
        page,
        limit: 15,
        status: statusFilter ? (statusFilter as ExpenseStatus) : undefined,
      });
      setItems(data.items);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les dépenses."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExportCsv() {
    setIsExporting(true);
    try {
      const { blob, filename } = await exportExpensesCsv({
        status: statusFilter ? (statusFilter as ExpenseStatus) : undefined,
      });
      triggerBrowserDownload(blob, filename);
      showSuccessToast("CSV téléchargé", filename);
    } catch (err) {
      showErrorToast(
        "Échec du téléchargement",
        getErrorMessage(err, "Impossible de générer le CSV."),
      );
    } finally {
      setIsExporting(false);
    }
  }

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, refreshKey]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Dépenses SwiftGoma</h1>
          <p className="text-muted-foreground text-sm">
            Dépenses internes de l&apos;entreprise — initiation par le
            comptable, approbation et paiement PawaPay par
            l&apos;administrateur.
          </p>
        </div>
        {isAccountant && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportCsv}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Génération…" : "Exporter en CSV"}
            </Button>
            {isAccountant && (
              <Button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Nouvelle dépense
              </Button>
            )}
          </div>
        )}
      </div>

      {isAdmin && pendingCount > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <p className="text-sm font-medium">
              {pendingCount} dépense{pendingCount > 1 ? "s" : ""} en attente
              d&apos;approbation
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-sm">Historique</CardTitle>
          <NativeSelect
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="w-44"
          >
            <NativeSelectOption value="">Tous les statuts</NativeSelectOption>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && <p className="text-destructive text-sm">{error}</p>}

          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune dépense pour le moment.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Réf.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-40" />
                    <TableHead>Créée par</TableHead>
                    {isAdmin && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.reference}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(item.incurredAt)}
                      </TableCell>
                      <TableCell className="max-w-45 truncate text-sm">
                        {item.title}
                      </TableCell>
                      <TableCell className="text-sm">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.vendorName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {item.amount} {item.currency}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[item.status]}>
                          {STATUS_LABELS[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.createdBy?.name ?? "—"}
                        <div className="text-muted-foreground text-xs">
                          {formatDateTime(item.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDetailId(item.id)}
                          >
                            Voir
                          </Button>
                          {isAccountant &&
                            (item.status === "PENDING" ||
                              item.status === "FAILED") && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingExpense(item);
                                  setFormOpen(true);
                                }}
                              >
                                Modifier
                              </Button>
                            )}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <ExpenseApprovalActions
                            expense={item}
                            onUpdated={() => setRefreshKey((k) => k + 1)}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-xs">
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
            </>
          )}
        </CardContent>
      </Card>

      <ExpenseFormDialog
        open={formOpen}
        expense={editingExpense}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingExpense(null);
        }}
        onSuccess={() => {
          setFormOpen(false);
          setEditingExpense(null);
          setRefreshKey((k) => k + 1);
        }}
      />

      <ExpenseDetailDialog
        expenseId={detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      />
    </div>
  );
}
