"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  listExchangeRates,
  upsertExchangeRate,
  deleteExchangeRate,
  previewConversion,
  type ExchangeRate,
} from "@/lib/api/routes/catalog";
import { getErrorMessage } from "@/lib/get-error-message";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { formatDateTime } from "@/lib/i18n/format";
import { ui } from "@/lib/i18n/common";

const CURRENCIES = ["USD", "CDF"];

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "CDF" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export default function ExchangeRatesPage() {
  const confirm = useConfirm();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [saveOpen, setSaveOpen] = useState(false);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("CDF");
  const [rate, setRate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [previewAmount, setPreviewAmount] = useState("100");
  const [previewFrom, setPreviewFrom] = useState("USD");
  const [previewTo, setPreviewTo] = useState("CDF");
  const [previewResult, setPreviewResult] = useState<{
    amount: number;
    rate: number;
    convertedAmount: number;
    fromCurrency: string;
    toCurrency: string;
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setRates(await listExchangeRates());
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les taux de change."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsedRate = Number(rate);
    if (!from.trim() || !to.trim() || !Number.isFinite(parsedRate) || parsedRate <= 0) {
      return;
    }
    setIsSaving(true);
    try {
      await upsertExchangeRate({
        fromCurrency: from.trim().toUpperCase(),
        toCurrency: to.trim().toUpperCase(),
        rate: parsedRate,
      });
      setRate("");
      setSaveOpen(false);
      await load();
      showSuccessToast(
        "Taux enregistré",
        `1 ${from.toUpperCase()} = ${parsedRate} ${to.toUpperCase()}`,
      );
    } catch (err) {
      showErrorToast("Impossible d'enregistrer le taux", getErrorMessage(err, "Réessayez."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string, label: string) {
    const ok = await confirm({
      title: "Supprimer le taux de change",
      description: `Supprimer le taux ${label} ? Les conversions au paiement utilisant cette paire échoueront jusqu'à ce qu'un nouveau taux soit défini.`,
      confirmLabel: ui.delete,
      destructive: true,
    });
    if (!ok) return;

    setDeletingId(id);
    try {
      await deleteExchangeRate(id);
      setRates((prev) => prev.filter((r) => r.id !== id));
      showSuccessToast("Taux supprimé");
    } catch (err) {
      showErrorToast("Impossible de supprimer le taux", getErrorMessage(err, "Réessayez."));
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setPreviewError(null);
    setPreviewResult(null);
    setIsPreviewing(true);
    try {
      const amount = Number(previewAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Saisissez un montant valide supérieur à zéro.");
      }
      const result = await previewConversion({
        amount,
        fromCurrency: previewFrom.trim().toUpperCase(),
        toCurrency: previewTo.trim().toUpperCase(),
      });
      setPreviewResult(result);
    } catch (err) {
      setPreviewError(getErrorMessage(err, "Impossible d'apercevoir cette conversion."));
    } finally {
      setIsPreviewing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Taux de change</h1>
          <p className="text-muted-foreground text-sm">
            Taux utilisés pour convertir les prix entre devises sur la marketplace.
          </p>
        </div>
        <Button onClick={() => setSaveOpen(true)}>
          <Plus className="h-4 w-4" />
          Définir un taux
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : rates.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">
              Aucun taux de change configuré pour l&apos;instant.
            </p>
            <Button className="mt-4" onClick={() => setSaveOpen(true)}>
              Ajouter votre premier taux
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>De</TableHead>
              <TableHead>Vers</TableHead>
              <TableHead>Taux</TableHead>
              <TableHead>Signification</TableHead>
              <TableHead>Mis à jour</TableHead>
              <TableHead className="text-right">{ui.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.fromCurrency}</TableCell>
                <TableCell>{r.toCurrency}</TableCell>
                <TableCell>{r.rate}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  1 {r.fromCurrency} = {r.rate} {r.toCurrency}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDateTime(r.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={deletingId === r.id}
                    onClick={() =>
                      handleDelete(r.id, `${r.fromCurrency} → ${r.toCurrency}`)
                    }
                  >
                    <Trash2 className="text-destructive h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Aperçu d&apos;une conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreview} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-2">
              <Field>
                <FieldLabel>Montant</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={previewAmount}
                  onChange={(e) => setPreviewAmount(e.target.value)}
                  className="w-28"
                />
              </Field>
              <Field>
                <FieldLabel>De</FieldLabel>
                <NativeSelect
                  value={previewFrom}
                  onChange={(e) => setPreviewFrom(e.target.value)}
                  className="w-24"
                >
                  {CURRENCIES.map((c) => (
                    <NativeSelectOption key={c} value={c}>
                      {c}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <ArrowLeftRight className="text-muted-foreground mb-2 h-4 w-4" />
              <Field>
                <FieldLabel>Vers</FieldLabel>
                <NativeSelect
                  value={previewTo}
                  onChange={(e) => setPreviewTo(e.target.value)}
                  className="w-24"
                >
                  {CURRENCIES.map((c) => (
                    <NativeSelectOption key={c} value={c}>
                      {c}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Button type="submit" variant="outline" disabled={isPreviewing}>
                {isPreviewing ? "Calcul en cours…" : "Aperçu"}
              </Button>
            </div>

            {previewResult && (
              <div className="bg-muted/40 rounded-lg p-4">
                <p className="text-lg font-semibold">
                  {formatMoney(previewResult.amount, previewResult.fromCurrency)} ={" "}
                  {formatMoney(
                    previewResult.convertedAmount,
                    previewResult.toCurrency,
                  )}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Taux utilisé : 1 {previewResult.fromCurrency} = {previewResult.rate}{" "}
                  {previewResult.toCurrency}
                </p>
              </div>
            )}
            {previewError && (
              <p className="text-destructive text-sm">{previewError}</p>
            )}
          </form>
        </CardContent>
      </Card>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Définir un taux de change</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <FieldGroup className="gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Devise source</FieldLabel>
                  <NativeSelect value={from} onChange={(e) => setFrom(e.target.value)}>
                    {CURRENCIES.map((c) => (
                      <NativeSelectOption key={c} value={c}>
                        {c}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel>Devise cible</FieldLabel>
                  <NativeSelect value={to} onChange={(e) => setTo(e.target.value)}>
                    {CURRENCIES.map((c) => (
                      <NativeSelectOption key={c} value={c}>
                        {c}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <Field>
                <FieldLabel>Taux</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="ex. 2800"
                  required
                />
                <FieldDescription>
                  Combien d&apos;unités {to || "cibles"} valent 1 unité {from || "source"}.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>
                {ui.cancel}
              </Button>
              <Button type="submit" disabled={isSaving || !rate}>
                {isSaving ? "Enregistrement…" : "Enregistrer le taux"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
