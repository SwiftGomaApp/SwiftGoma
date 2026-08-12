"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
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
  requestPawaPayPayoutApproval,
  confirmPawaPayPayout,
} from "@/lib/api/routes/payments";
import { getErrorMessage } from "@/lib/get-error-message";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { VerificationCodeDialog } from "@/components/dialogs/codes-dialog";
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
  type PayoutCountryOption,
} from "@/lib/pawapay-config";

interface PawaPayPayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (result: unknown) => void;
  onError: (message: string) => void;
}

export function PawaPayPayoutDialog({
  open,
  onOpenChange,
  onSuccess,
  onError,
}: PawaPayPayoutDialogProps) {
  const confirm = useConfirm();
  const [payoutOptions, setPayoutOptions] = useState<PayoutCountryOption[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [country, setCountry] = useState("");
  const [provider, setProvider] = useState("");
  const [currency, setCurrency] = useState("");
  const [localPhone, setLocalPhone] = useState("");
  const [customerMessage, setCustomerMessage] = useState("Paiement SwiftGoma");
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [approvalContext, setApprovalContext] = useState<{
    amount: number | string;
    currency: string;
    beneficiary: string;
    providerLabel: string;
  } | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const dialCode = DRC_DIAL_CODE;
  const countryProviders = useMemo(
    () => getProvidersForCountry(payoutOptions, country),
    [payoutOptions, country],
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
          operationType: "PAYOUT",
          country: DRC_PAWAPAY_COUNTRY,
        });
        if (cancelled) return;
        const options = parsePayoutOptions(data as PawaPayActiveConfig);
        setPayoutOptions(options);
        const defaults = getDefaultPayoutSelection(options);
        setCountry(defaults.country);
        setProvider(defaults.provider);
        setCurrency(defaults.currency);
        setLocalPhone("");
        setAmount("");
        setPendingId(null);
        setOtpError(null);
      } catch (err) {
        if (!cancelled) {
          setConfigError(
            getErrorMessage(
              err,
              "Impossible de charger la configuration de paiement PawaPay.",
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

  async function handleRequestApproval(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    if (!country || !provider || !currency || !localPhone.trim()) return;

    const recipientPhoneNumber = buildMsisdn(dialCode, localPhone);

    const ok = await confirm({
      title: "Demander l'approbation du paiement",
      description: `Demander l'envoi de ${parsedAmount} ${currency} au +${recipientPhoneNumber} via ${provider} ? Un code de vérification sera envoyé à votre e-mail administrateur.`,
      confirmLabel: "Envoyer le code de vérification",
      destructive: true,
    });
    if (!ok) return;

    setIsRequestingApproval(true);
    setOtpError(null);
    try {
      const result = await requestPawaPayPayoutApproval({
        amount: parsedAmount,
        currency,
        country,
        provider,
        recipientPhoneNumber,
        customerMessage,
      });
      setPendingId(result.pendingId);
      setApprovalContext({
        amount: result.summary.amount,
        currency: result.summary.currency,
        beneficiary: result.summary.recipientPhoneNumber,
        providerLabel: "PawaPay",
      });
      onOpenChange(false);
      setOtpOpen(true);
      showSuccessToast("Code de vérification envoyé", result.message);
    } catch (err) {
      showErrorToast(
        "Échec de la demande d'approbation",
        getErrorMessage(err, "Impossible de demander l'approbation du paiement."),
      );
    } finally {
      setIsRequestingApproval(false);
    }
  }

  async function handleConfirmOtp(code: string) {
    if (!pendingId) return;
    setIsConfirming(true);
    setOtpError(null);
    try {
      const result = await confirmPawaPayPayout({ pendingId, code });
      onSuccess(result);
      setOtpOpen(false);
      setPendingId(null);
      setApprovalContext(null);
      showSuccessToast(
        "Paiement approuvé",
        "Le paiement a été soumis à PawaPay.",
      );
    } catch (err) {
      setOtpError(getErrorMessage(err, "Code invalide ou expiré."));
    } finally {
      setIsConfirming(false);
    }
  }

  const canSubmit =
    !isLoadingConfig &&
    !configError &&
    payoutOptions.length > 0 &&
    country &&
    provider &&
    currency &&
    localPhone.trim();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-4 w-4" />
              Paiement manuel
            </DialogTitle>
            <DialogDescription>
              Paiements RDC uniquement (COD, CDF et USD). Les options de pays et
              de fournisseur proviennent de la configuration en direct de
              PawaPay. Vérification par e-mail requise.
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
        ) : payoutOptions.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">
            Aucune configuration de paiement RDC retournée par PawaPay pour le
            CDF ou l'USD.
          </p>
          ) : (
            <form onSubmit={handleRequestApproval}>
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
                  <FieldLabel>Pays</FieldLabel>
                  <Input value="RDC (COD)" readOnly disabled />
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
                  <FieldDescription>
                    Opérateurs mobile money activés pour les paiements RDC.
                  </FieldDescription>
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
                  <FieldLabel>Téléphone du destinataire</FieldLabel>
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
                    Chiffres uniquement — +{DRC_DIAL_CODE} est ajouté
                    automatiquement.
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
              </FieldGroup>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {ui.cancel}
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isRequestingApproval || !canSubmit}
                >
                  {isRequestingApproval
                    ? "Envoi du code…"
                    : "Demander le code d'approbation"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <VerificationCodeDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        type="payout-approval"
        context={approvalContext ?? undefined}
        onSubmit={handleConfirmOtp}
        isSubmitting={isConfirming}
        error={otpError}
      />
    </>
  );
}
