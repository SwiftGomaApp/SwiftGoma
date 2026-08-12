"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getExpense, type ExpenseRecord } from "@/lib/api/routes/expenses";
import { getErrorMessage } from "@/lib/get-error-message";
import { formatDate, formatDateTime } from "@/lib/i18n/format";
import { ui } from "@/lib/i18n/common";
import { useEffect, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  REJECTED: "Rejetée",
  PROCESSING: "Paiement en cours",
  COMPLETED: "Payée",
  FAILED: "Échec",
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

interface ExpenseDetailDialogProps {
  expenseId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseDetailDialog({
  expenseId,
  onOpenChange,
}: ExpenseDetailDialogProps) {
  const [expense, setExpense] = useState<ExpenseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expenseId) {
      setExpense(null);
      setError(null);
      return;
    }

    const id = expenseId;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getExpense(id);
        if (!cancelled) setExpense(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            getErrorMessage(err, "Impossible de charger cette dépense."),
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [expenseId]);

  return (
    <Dialog open={expenseId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Détail de la dépense</DialogTitle>
          <DialogDescription>
            {expense
              ? `${expense.reference} · ${formatDate(expense.incurredAt)}`
              : "Chargement…"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col gap-3 py-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : expense ? (
          <div className="flex flex-col gap-4 py-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {STATUS_LABELS[expense.status] ?? expense.status}
              </Badge>
              <Badge variant="secondary">
                {CATEGORY_LABELS[expense.category] ?? expense.category}
              </Badge>
            </div>

            <div>
              <p className="font-medium">{expense.title}</p>
              {expense.description && (
                <p className="text-muted-foreground mt-1">
                  {expense.description}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs">Montant</p>
                <p className="font-medium">
                  {expense.amount} {expense.currency}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Bénéficiaire</p>
                <p className="font-medium">{expense.vendorName}</p>
                <p className="text-muted-foreground text-xs">
                  {expense.vendorPhone}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Fournisseur</p>
                <p>{expense.providerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Créée par</p>
                <p>{expense.createdBy?.name ?? "—"}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDateTime(expense.createdAt)}
                </p>
              </div>
            </div>

            {expense.customerMessage && (
              <div>
                <p className="text-muted-foreground text-xs">
                  Message de paiement
                </p>
                <p>{expense.customerMessage}</p>
              </div>
            )}

            {expense.rejectionReason && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-xs font-medium text-destructive">
                  Motif de rejet
                </p>
                <p className="mt-1">{expense.rejectionReason}</p>
              </div>
            )}

            {expense.receiptUrl && (
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-xs">Justificatif</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  nativeButton={false}
                  render={
                    <a
                      href={expense.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir le justificatif
                </Button>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {ui.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
