"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, History, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TransactionResultCard } from "@/components/admin/transaction-result-card";
import {
  type AdminPayoutHistoryResponse,
  type AdminPayoutRecord,
} from "@/lib/api/routes/payments";
import { formatDateTime } from "@/lib/i18n/format";
import { getErrorMessage } from "@/lib/get-error-message";

const payoutStatusLabels: Record<AdminPayoutRecord["status"], string> = {
  PROCESSING: "En cours",
  COMPLETED: "Terminé",
  FAILED: "Échoué",
};

const RECENT_TRANSACTION_LIMIT = 5;

export type PaymentLookupMode = {
  id: string;
  label: string;
  fetchStatus: (reference: string) => Promise<unknown>;
  fetchHistory?: (params: {
    page: number;
    limit: number;
  }) => Promise<AdminPayoutHistoryResponse>;
  referenceLabel: string;
  referenceHint: string;
  referencePlaceholder: string;
};

type PaymentTransactionLookupProps = {
  title?: string;
  description?: string;
  modes: PaymentLookupMode[];
  defaultModeId?: string;
};

function RecentPayoutList({
  items,
  isLoading,
  error,
  onSelect,
  checkingId,
}: {
  items: AdminPayoutRecord[];
  isLoading: boolean;
  error: string | null;
  onSelect: (item: AdminPayoutRecord) => void;
  checkingId: string | null;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune opération récente trouvée. Utilisez la recherche par référence
        ci-dessous.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const canCheck = Boolean(item.externalId);
        return (
          <li
            key={item.id}
            className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">
                  {item.amount} {item.currency}
                </p>
                <Badge variant="outline">
                  {payoutStatusLabels[item.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {formatDateTime(item.createdAt)}
                {item.beneficiary ? ` · ${item.beneficiary}` : ""}
                {item.phoneNumber ? ` · ${item.phoneNumber}` : ""}
              </p>
              {item.externalId && (
                <p className="text-muted-foreground mt-1 font-mono text-[11px] break-all">
                  Réf. {item.externalId}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={!canCheck || checkingId === item.id}
              onClick={() => onSelect(item)}
            >
              {checkingId === item.id ? "Vérification…" : "Vérifier le statut"}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

export function PaymentTransactionLookup({
  title = "Vérifier une transaction",
  description = "Consultez le statut d'une opération sans avoir à retrouver un identifiant technique.",
  modes,
  defaultModeId,
}: PaymentTransactionLookupProps) {
  const initialMode = defaultModeId ?? modes[0]?.id ?? "";
  const [activeMode, setActiveMode] = useState(initialMode);
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const [historyItems, setHistoryItems] = useState<AdminPayoutRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const mode =
    modes.find((entry) => entry.id === activeMode) ?? modes[0];

  const loadHistory = useCallback(async () => {
    if (!mode?.fetchHistory) {
      setHistoryItems([]);
      setHistoryError(null);
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await mode.fetchHistory({
        page: 1,
        limit: RECENT_TRANSACTION_LIMIT,
      });
      setHistoryItems(response.items);
    } catch (err) {
      setHistoryError(
        getErrorMessage(err, "Impossible de charger l'historique récent."),
      );
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    setReference("");
    setResult(null);
    setError(null);
    loadHistory();
  }, [loadHistory, activeMode]);

  async function runLookup(value: string) {
    if (!mode || !value.trim()) return;

    setIsSearching(true);
    setError(null);
    setResult(null);
    try {
      setResult(await mode.fetchStatus(value.trim()));
    } catch (err) {
      setError(getErrorMessage(err, "La vérification a échoué."));
    } finally {
      setIsSearching(false);
      setCheckingId(null);
    }
  }

  async function handleManualSearch(e: React.FormEvent) {
    e.preventDefault();
    await runLookup(reference);
  }

  async function handleHistorySelect(item: AdminPayoutRecord) {
    if (!item.externalId) return;
    setReference(item.externalId);
    setCheckingId(item.id);
    await runLookup(item.externalId);
  }

  if (!mode) return null;

  const body = (
    <div className="flex flex-col gap-6">
      {mode.fetchHistory && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <History className="text-muted-foreground h-4 w-4" />
            <p className="text-sm font-medium">Opérations récentes</p>
          </div>
          <RecentPayoutList
            items={historyItems}
            isLoading={historyLoading}
            error={historyError}
            onSelect={handleHistorySelect}
            checkingId={checkingId}
          />
          <div className="flex justify-end">
            <Button
              render={<Link href="/payments/transactions" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              Voir tout l&apos;historique
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Search className="text-muted-foreground h-4 w-4" />
          <p className="text-sm font-medium">Recherche par référence</p>
        </div>
        <form onSubmit={handleManualSearch} className="flex flex-col gap-3">
          <Field>
            <FieldLabel>{mode.referenceLabel}</FieldLabel>
            <FieldDescription>{mode.referenceHint}</FieldDescription>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={mode.referencePlaceholder}
                className="sm:flex-1"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={isSearching || !reference.trim()}
                className="shrink-0"
              >
                {isSearching ? "Vérification…" : "Vérifier le statut"}
              </Button>
            </div>
          </Field>
        </form>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {result !== null && (
        <TransactionResultCard
          title={`Statut — ${mode.label}`}
          data={result}
        />
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      <CardContent>
        {modes.length > 1 && (
          <Tabs
            value={activeMode}
            onValueChange={setActiveMode}
            className="mb-4"
          >
            <TabsList>
              {modes.map((entry) => (
                <TabsTrigger key={entry.id} value={entry.id}>
                  {entry.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        {body}
      </CardContent>
    </Card>
  );
}
