"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  getPawaPayActiveConfiguration,
  initiatePawaPayDeposit,
} from "@/lib/api/routes/payments";
import { getErrorMessage } from "@/lib/get-error-message";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ui } from "@/lib/i18n/common";
import {
  buildMsisdn,
  getCurrenciesForProvider,
  getDefaultPayoutSelection,
  getProvidersForCountry,
  parseDepositOptions,
  DRC_PAWAPAY_COUNTRY,
  DRC_DIAL_CODE,
  type PawaPayActiveConfig,
  type PayoutCountryOption,
} from "@/lib/pawapay-config";

interface PawaPayDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: unknown) => void;
}

export function PawaPayDepositDialog({
  open,
  onOpenChange,
  onSuccess,
}: PawaPayDepositDialogProps) {
  const [depositOptions, setDepositOptions] = useState<PayoutCountryOption[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [country, setCountry] = useState("");
  const [provider, setProvider] = useState("");
  const [currency, setCurrency] = useState("");
  const [localPhone, setLocalPhone] = useState("");
  const [customerMessage, setCustomerMessage] = useState("SwiftGoma");
  const [clientReferenceId, setClientReferenceId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryProviders = useMemo(
    () => getProvidersForCountry(depositOptions, country),
    [depositOptions, country],
  );
  const providerCurrencies = useMemo(
    () => getCurrenciesForProvider(countryProviders, provider),
    [countryProviders, provider],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function loadConfig() {
      setIsLoadingConfig(true);
      setConfigError(null);
      try {
        const data = await getPawaPayActiveConfiguration({
          operationType: "DEPOSIT",
          country: DRC_PAWAPAY_COUNTRY,
        });
        if (cancelled) return;
        const options = parseDepositOptions(data as PawaPayActiveConfig);
        setDepositOptions(options);
        const defaults = getDefaultPayoutSelection(options);
        setCountry(defaults.country);
        setProvider(defaults.provider);
        setCurrency(defaults.currency);
        setLocalPhone("");
        setAmount("");
        setClientReferenceId("");
      } catch (err) {
        if (!cancelled) {
          setConfigError(
            getErrorMessage(
              err,
              "Impossible de charger la configuration de dépôt PawaPay.",
            ),
          );
        }
      } finally {
        if (!cancelled) setIsLoadingConfig(false);
      }
    }

    loadConfig();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function handleProviderChange(nextProvider: string) {
    const currencies = getCurrenciesForProvider(countryProviders, nextProvider);
    setProvider(nextProvider);
    setCurrency(currencies[0] ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    if (!country || !provider || !currency || !localPhone.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await initiatePawaPayDeposit({
        amount: parsedAmount,
        currency,
        country,
        provider,
        payerPhoneNumber: buildMsisdn(DRC_DIAL_CODE, localPhone),
        customerMessage,
        clientReferenceId: clientReferenceId.trim() || undefined,
      });
      onSuccess(result);
      onOpenChange(false);
      showSuccessToast(
        "Dépôt initié",
        "La demande de dépôt a été envoyée à PawaPay.",
      );
    } catch (err) {
      showErrorToast(
        "Échec du dépôt",
        getErrorMessage(err, "Impossible d'initier ce dépôt."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    !isLoadingConfig &&
    !configError &&
    depositOptions.length > 0 &&
    country &&
    provider &&
    currency &&
    localPhone.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dépôt manuel</DialogTitle>
          <DialogDescription>
            Encaissement mobile money RDC (COD, CDF et USD). Les options
            proviennent de la configuration en direct de PawaPay.
          </DialogDescription>
        </DialogHeader>

        {isLoadingConfig ? (
          <div className="flex flex-col gap-3 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : configError ? (
          <p className="text-destructive py-4 text-sm">{configError}</p>
        ) : depositOptions.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">
            Aucune configuration de dépôt RDC retournée par PawaPay.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-4 py-2">
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
                <FieldLabel>Fournisseur</FieldLabel>
                <NativeSelect
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  required
                  disabled={countryProviders.length === 0}
                >
                  {countryProviders.map((p) => (
                    <NativeSelectOption key={p.provider} value={p.provider}>
                      {p.provider}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel>Devise</FieldLabel>
                <NativeSelect
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                  disabled={providerCurrencies.length === 0}
                >
                  {providerCurrencies.map((c) => (
                    <NativeSelectOption key={c} value={c}>
                      {c}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel>Téléphone du payeur</FieldLabel>
                <div className="flex">
                  <span className="bg-muted text-muted-foreground inline-flex items-center rounded-l-md border border-r-0 px-3 text-sm">
                    +{DRC_DIAL_CODE}
                  </span>
                  <Input
                    value={localPhone}
                    onChange={(e) =>
                      setLocalPhone(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="812345678"
                    className="rounded-l-none"
                    inputMode="numeric"
                    required
                  />
                </div>
                <FieldDescription>
                  Chiffres uniquement — +{DRC_DIAL_CODE} est ajouté automatiquement.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Message client</FieldLabel>
                <Input
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  maxLength={22}
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Référence interne (facultatif)</FieldLabel>
                <Input
                  value={clientReferenceId}
                  onChange={(e) => setClientReferenceId(e.target.value)}
                  placeholder="Ex. SWG-DEP-…"
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
              <Button type="submit" disabled={isSubmitting || !canSubmit}>
                {isSubmitting ? "Envoi…" : "Initier le dépôt"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
