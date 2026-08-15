"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  createExpense,
  getExpenseMeta,
  updateExpense,
  type ExpenseCategory,
  type ExpenseRecord,
} from "@/lib/api/routes/expenses";
import { getPawaPayActiveConfiguration } from "@/lib/api/routes/payments";
import { getErrorMessage } from "@/lib/get-error-message";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ui } from "@/lib/i18n/common";
import {
  buildMsisdn,
  getCurrenciesForProvider,
  getDefaultPayoutSelection,
  getProvidersForCountry,
  parsePayoutOptions,
  DRC_PAWAPAY_COUNTRY,
  DRC_DIAL_CODE,
  type PawaPayActiveConfig,
} from "@/lib/pawapay-config";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  OPERATIONS: "Opérations",
  MARKETING: "Marketing",
  PAYROLL: "Paie",
  LEGAL: "Juridique",
  TRAVEL: "Déplacements",
  UTILITIES: "Services",
  EQUIPMENT: "Équipement",
  OTHER: "Autre",
};

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  expense?: ExpenseRecord | null;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  onSuccess,
  expense = null,
}: ExpenseFormDialogProps) {
  const isEditMode = expense !== null;
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("OPERATIONS");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CDF");
  const [incurredAt, setIncurredAt] = useState(toDateInputValue(new Date()));
  const [vendorName, setVendorName] = useState("");
  const [localPhone, setLocalPhone] = useState("");
  const [provider, setProvider] = useState("");
  const [customerMessage, setCustomerMessage] = useState("DepenseSwiftGoma");
  const [receipt, setReceipt] = useState<File | null>(null);

  const [countryProviders, setCountryProviders] = useState<
    ReturnType<typeof getProvidersForCountry>
  >([]);

  const providerCurrencies = useMemo(
    () => getCurrenciesForProvider(countryProviders, provider),
    [countryProviders, provider],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const [meta, config] = await Promise.all([
          getExpenseMeta(),
          getPawaPayActiveConfiguration({
            operationType: "PAYOUT",
            country: DRC_PAWAPAY_COUNTRY,
          }),
        ]);
        if (cancelled) return;
        setCategories(meta.categories);
        const options = parsePayoutOptions(config as PawaPayActiveConfig);
        const providers = getProvidersForCountry(options, DRC_PAWAPAY_COUNTRY);
        setCountryProviders(providers);

        if (expense) {
          setTitle(expense.title);
          setDescription(expense.description ?? "");
          setCategory(expense.category);
          setAmount(String(expense.amount));
          setCurrency(expense.currency);
          setIncurredAt(toDateInputValue(new Date(expense.incurredAt)));
          setVendorName(expense.vendorName);
          setLocalPhone(
            expense.vendorPhone.startsWith(DRC_DIAL_CODE)
              ? expense.vendorPhone.slice(DRC_DIAL_CODE.length)
              : expense.vendorPhone,
          );
          setProvider(expense.providerName);
          setCustomerMessage(expense.customerMessage);
        } else {
          setTitle("");
          setDescription("");
          setCategory("OPERATIONS");
          setAmount("");
          setIncurredAt(toDateInputValue(new Date()));
          setVendorName("");
          setLocalPhone("");
          setCustomerMessage("DepenseSwiftGoma");
          setReceipt(null);
          const defaults = getDefaultPayoutSelection(options);
          setProvider(defaults.provider);
          setCurrency(defaults.currency);
        }
      } catch (err) {
        if (!cancelled) {
          showErrorToast(
            "Configuration",
            getErrorMessage(err, "Impossible de charger la configuration."),
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
  }, [open, expense]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    if (!localPhone.trim() || !provider) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description: description || undefined,
        category,
        amount: parsedAmount,
        currency,
        incurredAt,
        vendorName,
        vendorPhone: buildMsisdn(DRC_DIAL_CODE, localPhone),
        countryCode: DRC_PAWAPAY_COUNTRY,
        providerName: provider,
        customerMessage,
        receipt,
      };

      if (isEditMode && expense) {
        await updateExpense(expense.id, payload);
        showSuccessToast(
          "Dépense modifiée",
          "Les changements ont été enregistrés.",
        );
      } else {
        await createExpense(payload);
        showSuccessToast(
          "Dépense créée",
          "En attente d'approbation par un administrateur.",
        );
      }
      onSuccess();
    } catch (err) {
      showErrorToast(
        "Échec",
        getErrorMessage(
          err,
          isEditMode
            ? "Impossible de modifier la dépense."
            : "Impossible de créer la dépense.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier la dépense" : "Nouvelle dépense"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Seules les dépenses en attente ou en échec peuvent être modifiées."
              : "Saisissez les détails de la dépense. Le paiement PawaPay sera déclenché après approbation OTP par un administrateur."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col gap-3 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-4 py-2">
              <Field>
                <FieldLabel>Titre</FieldLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </Field>

              <Field>
                <FieldLabel>Catégorie</FieldLabel>
                <NativeSelect
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ExpenseCategory)
                  }
                  required
                >
                  {categories.map((cat) => (
                    <NativeSelectOption key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel>Date de la dépense</FieldLabel>
                <Input
                  type="date"
                  value={incurredAt}
                  onChange={(e) => setIncurredAt(e.target.value)}
                  required
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Montant</FieldLabel>
                  <Input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Devise</FieldLabel>
                  <NativeSelect
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    required
                  >
                    {providerCurrencies.map((c) => (
                      <NativeSelectOption key={c} value={c}>
                        {c}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              </div>

              <Field>
                <FieldLabel>Bénéficiaire</FieldLabel>
                <Input
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Fournisseur mobile money</FieldLabel>
                <NativeSelect
                  value={provider}
                  onChange={(e) => {
                    const next = e.target.value;
                    setProvider(next);
                    const currencies = getCurrenciesForProvider(
                      countryProviders,
                      next,
                    );
                    if (currencies[0]) setCurrency(currencies[0]);
                  }}
                  required
                >
                  {countryProviders.map((p) => (
                    <NativeSelectOption key={p.provider} value={p.provider}>
                      {p.provider}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel>Téléphone du bénéficiaire</FieldLabel>
                <div className="flex">
                  <span className="bg-muted text-muted-foreground inline-flex items-center rounded-l-md border border-r-0 px-3 text-sm">
                    +{DRC_DIAL_CODE}
                  </span>
                  <Input
                    value={localPhone}
                    onChange={(e) =>
                      setLocalPhone(e.target.value.replace(/\D/g, ""))
                    }
                    className="rounded-l-none"
                    inputMode="numeric"
                    required
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel>Message client PawaPay</FieldLabel>
                <Input
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  maxLength={22}
                  required
                />
                <FieldDescription>
                  4 à 22 caractères alphanumériques.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>
                  {isEditMode
                    ? "Remplacer le justificatif (optionnel)"
                    : "Justificatif (optionnel)"}
                </FieldLabel>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                />
              </Field>
            </FieldGroup>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {ui.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Enregistrement…"
                  : isEditMode
                    ? "Enregistrer les modifications"
                    : "Soumettre la dépense"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
