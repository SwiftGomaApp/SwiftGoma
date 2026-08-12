"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  getMbiyoPayBalances,
  getMbiyoPayNetworkBalances,
  getMbiyoPayTransactionStatus,
  initiateMbiyoPayPayin,
  requestMbiyoPayPayoutApproval,
  confirmMbiyoPayPayout,
  getAdminTransactions,
  type MbiyoPayPayoutApprovalSummary,
} from "@/lib/api/routes/payments";
import { getErrorMessage } from "@/lib/get-error-message";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { TransactionResultCard } from "@/components/admin/transaction-result-card";
import { PaymentTransactionLookup } from "@/components/admin/payment-transaction-lookup";
import { VerificationCodeDialog } from "@/components/dialogs/codes-dialog";
import { FeedbackDialog } from "@/components/admin/feedback-dialog";
import {
  DRC_DIAL_CODE,
  DRC_MBiyopAY_COUNTRY_CODE,
  DRC_CURRENCIES,
  filterWalletBalances,
} from "@/lib/drc-payments";
import { buildMsisdn } from "@/lib/pawapay-config";
import { WalletBalancesPanel } from "@/components/admin/wallet-balances-panel";
import { useAuth } from "@/providers/auth-provider";
import { ui } from "@/lib/i18n/common";

const NETWORKS = ["vodacom", "airtel", "orange", "africell"];

const emptyPayinForm = {
  amount: "",
  currency: "CDF",
  network: "vodacom",
  localPhone: "",
  orderId: "",
};

const emptyPayoutForm = {
  amount: "",
  currency: "CDF",
  network: "vodacom",
  localPhone: "",
  beneficiary: "",
};

export default function MbiyoPayPage() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const canManagePayouts = user?.role === "ADMIN";
  const [balances, setBalances] = useState<unknown>(null);
  const [networkBalances, setNetworkBalances] = useState<unknown>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [balancesError, setBalancesError] = useState<string | null>(null);

  const [payinOpen, setPayinOpen] = useState(false);
  const [payinForm, setPayinForm] = useState(emptyPayinForm);
  const [isPayinSubmitting, setIsPayinSubmitting] = useState(false);
  const [payinResult, setPayinResult] = useState<unknown>(null);

  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutForm, setPayoutForm] = useState(emptyPayoutForm);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [approvalSummary, setApprovalSummary] =
    useState<MbiyoPayPayoutApprovalSummary | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [payoutResult, setPayoutResult] = useState<unknown>(null);

  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description?: string;
  }>({ open: false, variant: "success", title: "" });

  useEffect(() => {
    async function loadBalances() {
      setIsLoadingBalances(true);
      setBalancesError(null);
      try {
        const [wallet, network] = await Promise.all([
          getMbiyoPayBalances(),
          getMbiyoPayNetworkBalances({ countryCode: DRC_MBiyopAY_COUNTRY_CODE }),
        ]);
        setBalances(filterWalletBalances(wallet));
        setNetworkBalances(filterWalletBalances(network));
      } catch (err) {
        setBalancesError(getErrorMessage(err, "Impossible de charger les soldes MbiyoPay."));
      } finally {
        setIsLoadingBalances(false);
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadBalances();
  }, []);

  async function handlePayin(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(payinForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const ok = await confirm({
      title: "Confirmer le payin",
      description: `Demander ${amount} ${payinForm.currency} au +${DRC_DIAL_CODE}${payinForm.localPhone} via ${payinForm.network} ?`,
      confirmLabel: "Initier le payin",
    });
    if (!ok) return;

    setIsPayinSubmitting(true);
    try {
      const result = await initiateMbiyoPayPayin({
        amount,
        currency: payinForm.currency,
        network: payinForm.network,
        phoneNumber: buildMsisdn(DRC_DIAL_CODE, payinForm.localPhone),
        countryCode: DRC_MBiyopAY_COUNTRY_CODE,
        orderId: payinForm.orderId.trim() || undefined,
      });
      setPayinResult(result);
      setPayinOpen(false);
      setPayinForm(emptyPayinForm);
      showSuccessToast("Payin initié", "La demande a été envoyée à MbiyoPay.");
    } catch (err) {
      showErrorToast(
        "Échec du payin",
        getErrorMessage(err, "Impossible d'initier ce payin."),
      );
    } finally {
      setIsPayinSubmitting(false);
    }
  }

  async function handleRequestApproval(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(payoutForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const ok = await confirm({
      title: "Demander l'approbation du paiement sortant",
      description: `Demander l'envoi de ${amount} ${payoutForm.currency} à ${payoutForm.beneficiary} (+${DRC_DIAL_CODE}${payoutForm.localPhone}) ? Un code de vérification sera envoyé à votre e-mail administrateur.`,
      confirmLabel: "Envoyer le code de vérification",
      destructive: true,
    });
    if (!ok) return;

    setIsRequestingApproval(true);
    setOtpError(null);
    try {
      const result = await requestMbiyoPayPayoutApproval({
        amount,
        currency: payoutForm.currency,
        network: payoutForm.network,
        phoneNumber: buildMsisdn(DRC_DIAL_CODE, payoutForm.localPhone),
        countryCode: DRC_MBiyopAY_COUNTRY_CODE,
        beneficiary: payoutForm.beneficiary,
      });
      setPendingId(result.pendingId);
      setApprovalSummary(result.summary);
      setPayoutOpen(false);
      setOtpOpen(true);
      showSuccessToast("Code de vérification envoyé", result.message);
    } catch (err) {
      showErrorToast(
        "Échec de la demande d'approbation",
        getErrorMessage(err, "Impossible de demander l'approbation du paiement sortant."),
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
      const result = await confirmMbiyoPayPayout({ pendingId, code });
      setPayoutResult(result);
      setOtpOpen(false);
      setPendingId(null);
      setApprovalSummary(null);
      setPayoutForm(emptyPayoutForm);
      showSuccessToast("Paiement sortant approuvé", "Le paiement sortant a été soumis à MbiyoPay.");
    } catch (err) {
      setOtpError(getErrorMessage(err, "Code invalide ou expiré."));
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">MbiyoPay</h1>
          <p className="text-muted-foreground text-sm">
            Paiements de commandes pour la RDC (CDF et USD) — soldes de portefeuille,
            recherche de transactions et paiements sortants approuvés par l&apos;administrateur.
          </p>
        </div>
        <div className="flex gap-2">
          {canManagePayouts && (
            <Button variant="outline" onClick={() => setPayinOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouveau payin
            </Button>
          )}
          <Button onClick={() => setPayoutOpen(true)} disabled={!canManagePayouts}>
            <Plus className="h-4 w-4" />
            Nouveau paiement sortant
          </Button>
        </div>
      </div>

      {balancesError ? (
        <p className="text-destructive text-sm">{balancesError}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <WalletBalancesPanel
            title="Soldes de portefeuille"
            subtitle="République démocratique du Congo · CDF et USD"
            items={balances}
            isLoading={isLoadingBalances}
            emptyMessage="Aucun solde CDF ou USD renvoyé."
          />
          <WalletBalancesPanel
            title="Soldes par réseau"
            subtitle="Par opérateur mobile money · RDC"
            items={networkBalances}
            isLoading={isLoadingBalances}
            variant="network"
            emptyMessage="Aucun solde réseau renvoyé pour la RDC."
          />
        </div>
      )}

      <PaymentTransactionLookup
        description="Sélectionnez une opération récente ou saisissez la référence affichée sur une commande ou un paiement sortant."
        modes={[
          {
            id: "transaction",
            label: "Transaction",
            fetchStatus: getMbiyoPayTransactionStatus,
            fetchHistory: (params) =>
              getAdminTransactions({ ...params, provider: "MBIYOPAY" }),
            referenceLabel: "Référence de commande ou de transaction",
            referenceHint:
              "Utilisez la référence SWG-ORD-… d'une commande client, SWG-OUT-… d'un paiement sortant, ou l'identifiant MbiyoPay si vous l'avez.",
            referencePlaceholder: "Ex. SWG-ORD-… ou SWG-OUT-…",
          },
        ]}
      />

      {payinResult !== null && (
        <TransactionResultCard title="Dernier résultat de payin" data={payinResult} />
      )}
      {payoutResult !== null && (
        <TransactionResultCard title="Dernier résultat de paiement sortant" data={payoutResult} />
      )}

      {canManagePayouts && (
        <>
          <Dialog open={payinOpen} onOpenChange={setPayinOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Payin manuel</DialogTitle>
                <DialogDescription>
                  Encaissement mobile money RDC (CDF et USD) via MbiyoPay.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePayin}>
                <FieldGroup className="gap-4 py-2">
                  <Field>
                    <FieldLabel>Montant</FieldLabel>
                    <Input
                      type="number"
                      step="any"
                      value={payinForm.amount}
                      onChange={(e) =>
                        setPayinForm((f) => ({ ...f, amount: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Devise</FieldLabel>
                    <NativeSelect
                      value={payinForm.currency}
                      onChange={(e) =>
                        setPayinForm((f) => ({ ...f, currency: e.target.value }))
                      }
                    >
                      {DRC_CURRENCIES.map((c) => (
                        <NativeSelectOption key={c} value={c}>
                          {c}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel>Réseau</FieldLabel>
                    <NativeSelect
                      value={payinForm.network}
                      onChange={(e) =>
                        setPayinForm((f) => ({ ...f, network: e.target.value }))
                      }
                    >
                      {NETWORKS.map((n) => (
                        <NativeSelectOption key={n} value={n}>
                          {n}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel>Numéro de téléphone</FieldLabel>
                    <div className="flex">
                      <span className="bg-muted text-muted-foreground inline-flex items-center rounded-l-md border border-r-0 px-3 text-sm">
                        +{DRC_DIAL_CODE}
                      </span>
                      <Input
                        value={payinForm.localPhone}
                        onChange={(e) =>
                          setPayinForm((f) => ({
                            ...f,
                            localPhone: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        placeholder="812345678"
                        className="rounded-l-none"
                        inputMode="numeric"
                        required
                      />
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel>Référence commande (facultatif)</FieldLabel>
                    <Input
                      value={payinForm.orderId}
                      onChange={(e) =>
                        setPayinForm((f) => ({ ...f, orderId: e.target.value }))
                      }
                      placeholder="Ex. SWG-ORD-…"
                    />
                  </Field>
                </FieldGroup>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setPayinOpen(false)}>
                    {ui.cancel}
                  </Button>
                  <Button type="submit" disabled={isPayinSubmitting}>
                    {isPayinSubmitting ? "Envoi…" : "Initier le payin"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-4 w-4" />
              Paiement sortant manuel
            </DialogTitle>
            <DialogDescription>
              Paiements sortants RDC uniquement (CDF et USD). Une vérification par e-mail est
              requise avant tout envoi d&apos;argent.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestApproval}>
            <FieldGroup className="gap-4 py-2">
              <Field>
                <FieldLabel>Montant</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  value={payoutForm.amount}
                  onChange={(e) =>
                    setPayoutForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Devise</FieldLabel>
                <NativeSelect
                  value={payoutForm.currency}
                  onChange={(e) =>
                    setPayoutForm((f) => ({ ...f, currency: e.target.value }))
                  }
                >
                  {DRC_CURRENCIES.map((c) => (
                    <NativeSelectOption key={c} value={c}>
                      {c}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel>Pays</FieldLabel>
                <Input value="RDC (CD)" readOnly disabled />
              </Field>
              <Field>
                <FieldLabel>Réseau</FieldLabel>
                <NativeSelect
                  value={payoutForm.network}
                  onChange={(e) =>
                    setPayoutForm((f) => ({ ...f, network: e.target.value }))
                  }
                >
                  {NETWORKS.map((n) => (
                    <NativeSelectOption key={n} value={n}>
                      {n}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel>Numéro de téléphone</FieldLabel>
                <div className="flex">
                  <span className="bg-muted text-muted-foreground inline-flex items-center rounded-l-md border border-r-0 px-3 text-sm">
                    +{DRC_DIAL_CODE}
                  </span>
                  <Input
                    value={payoutForm.localPhone}
                    onChange={(e) =>
                      setPayoutForm((f) => ({
                        ...f,
                        localPhone: e.target.value.replace(/\D/g, ""),
                      }))
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
                <FieldLabel>Nom du bénéficiaire</FieldLabel>
                <Input
                  value={payoutForm.beneficiary}
                  onChange={(e) =>
                    setPayoutForm((f) => ({ ...f, beneficiary: e.target.value }))
                  }
                  required
                />
                <FieldDescription>
                  Doit correspondre au titulaire du compte mobile money.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setPayoutOpen(false)}>
                {ui.cancel}
              </Button>
              <Button type="submit" variant="destructive" disabled={isRequestingApproval}>
                {isRequestingApproval ? "Envoi du code…" : "Demander le code d'approbation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <VerificationCodeDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        type="payout-approval"
        context={
          approvalSummary
            ? {
                amount: approvalSummary.amount,
                currency: approvalSummary.currency,
                beneficiary: approvalSummary.beneficiary,
                providerLabel: "MbiyoPay",
              }
            : undefined
        }
        onSubmit={handleConfirmOtp}
        isSubmitting={isConfirming}
        error={otpError}
      />
        </>
      )}

      <FeedbackDialog
        open={feedback.open}
        onOpenChange={(open) => setFeedback((f) => ({ ...f, open }))}
        variant={feedback.variant}
        title={feedback.title}
        description={feedback.description}
      />
    </div>
  );
}
