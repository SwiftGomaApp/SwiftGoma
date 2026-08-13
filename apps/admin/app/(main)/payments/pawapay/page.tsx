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
} from "@/components/ui/field";
import {
  getPawaPayBalances,
  getPawaPayDepositStatus,
  getPawaPayPayoutStatus,
  getPawaPayRefundStatus,
  getAdminTransactions,
  requestPawaPayRefundApproval,
  confirmPawaPayRefund,
  type PawaPayWalletBalance,
} from "@/lib/api/routes/payments";
import { getErrorMessage } from "@/lib/get-error-message";
import { filterPawaPayWalletBalances } from "@/lib/drc-payments";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { showSuccessToast, showErrorToast } from "@/lib/admin-toast";
import { TransactionResultCard } from "@/components/admin/transaction-result-card";
import { PaymentTransactionLookup } from "@/components/admin/payment-transaction-lookup";
import { FeedbackDialog } from "@/components/admin/feedback-dialog";
import { PawaPayPayoutDialog } from "@/components/admin/pawapay-payout-dialog";
import { PawaPayDepositDialog } from "@/components/admin/pawapay-deposit-dialog";
import { WalletBalancesPanel } from "@/components/admin/wallet-balances-panel";
import { VerificationCodeDialog } from "@/components/dialogs/codes-dialog";
import { useAuth } from "@/providers/auth-provider";
import { ui } from "@/lib/i18n/common";

const emptyRefundForm = {
  depositId: "",
  amount: "",
};

export default function PawaPayPage() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const canManagePayouts = user?.role === "ADMIN";
  const [balances, setBalances] = useState<PawaPayWalletBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [balancesError, setBalancesError] = useState<string | null>(null);

  const [payoutOpen, setPayoutOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [payoutResult, setPayoutResult] = useState<unknown>(null);
  const [depositResult, setDepositResult] = useState<unknown>(null);

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundForm, setRefundForm] = useState(emptyRefundForm);
  const [isRequestingRefundApproval, setIsRequestingRefundApproval] = useState(false);
  const [refundPendingId, setRefundPendingId] = useState<string | null>(null);
  const [refundApprovalContext, setRefundApprovalContext] = useState<{
    amount: number | string;
    currency: string;
    beneficiary: string;
    providerLabel: string;
  } | null>(null);
  const [refundOtpOpen, setRefundOtpOpen] = useState(false);
  const [refundOtpError, setRefundOtpError] = useState<string | null>(null);
  const [isConfirmingRefund, setIsConfirmingRefund] = useState(false);
  const [refundResult, setRefundResult] = useState<unknown>(null);

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
        const result = await getPawaPayBalances();
        setBalances(filterPawaPayWalletBalances(result.balances));
      } catch (err) {
        setBalancesError(getErrorMessage(err, "Impossible de charger les soldes PawaPay."));
      } finally {
        setIsLoadingBalances(false);
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadBalances();
  }, []);

  async function handleRequestRefundApproval(e: React.FormEvent) {
    e.preventDefault();
    if (!refundForm.depositId.trim()) return;

    const ok = await confirm({
      title: "Demander l'approbation du remboursement",
      description: `Demander un remboursement pour le dépôt ${refundForm.depositId}${refundForm.amount ? ` d'un montant de ${refundForm.amount}` : " (montant total)"} ? Un code de vérification sera envoyé à votre e-mail administrateur.`,
      confirmLabel: "Envoyer le code de vérification",
      destructive: true,
    });
    if (!ok) return;

    setIsRequestingRefundApproval(true);
    setRefundOtpError(null);
    try {
      const result = await requestPawaPayRefundApproval({
        depositId: refundForm.depositId.trim(),
        amount: refundForm.amount ? Number(refundForm.amount) : undefined,
      });
      setRefundPendingId(result.pendingId);
      setRefundApprovalContext({
        amount: result.summary.amount ?? "total",
        currency: result.summary.currency ?? "—",
        beneficiary: result.summary.depositId,
        providerLabel: "PawaPay Remboursement",
      });
      setRefundOpen(false);
      setRefundOtpOpen(true);
      showSuccessToast("Code de vérification envoyé", result.message);
    } catch (err) {
      showErrorToast(
        "Échec de la demande d'approbation",
        getErrorMessage(err, "Impossible de demander l'approbation du remboursement."),
      );
    } finally {
      setIsRequestingRefundApproval(false);
    }
  }

  async function handleConfirmRefundOtp(code: string) {
    if (!refundPendingId) return;
    setIsConfirmingRefund(true);
    setRefundOtpError(null);
    try {
      const result = await confirmPawaPayRefund({
        pendingId: refundPendingId,
        code,
      });
      setRefundResult(result);
      setRefundOtpOpen(false);
      setRefundPendingId(null);
      setRefundApprovalContext(null);
      setRefundForm(emptyRefundForm);
      showSuccessToast(
        "Remboursement approuvé",
        "La demande de remboursement a été envoyée à PawaPay.",
      );
    } catch (err) {
      setRefundOtpError(getErrorMessage(err, "Code invalide ou expiré."));
    } finally {
      setIsConfirmingRefund(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">PawaPay</h1>
          <p className="text-muted-foreground text-sm">
            Paiements d&apos;abonnement pour la RDC (CDF et USD) — soldes de portefeuille,
            recherche de transactions, paiements sortants et remboursements.
          </p>
        </div>
        <div className="flex gap-2">
          {canManagePayouts && (
            <>
              <Button variant="outline" onClick={() => setDepositOpen(true)}>
                Nouveau dépôt
              </Button>
              <Button variant="outline" onClick={() => setRefundOpen(true)}>
                Remboursement manuel
              </Button>
              <Button onClick={() => setPayoutOpen(true)}>
                <Plus className="h-4 w-4" />
                Nouveau paiement sortant
              </Button>
            </>
          )}
        </div>
      </div>

      <WalletBalancesPanel
        title="Soldes de portefeuille"
        subtitle="République démocratique du Congo · CDF et USD"
        items={balances}
        isLoading={isLoadingBalances}
        error={balancesError}
        emptyMessage="Aucun solde CDF ou USD renvoyé par PawaPay."
      />

      <PaymentTransactionLookup
        description="Choisissez une opération récente ou recherchez avec une référence connue (commande, abonnement, e-mail de confirmation)."
        modes={[
          {
            id: "deposit",
            label: "Dépôt",
            fetchStatus: getPawaPayDepositStatus,
            referenceLabel: "Référence du dépôt",
            referenceHint:
              "Utilisez l'identifiant de dépôt PawaPay enregistré lors d'un paiement d'abonnement. Il apparaît dans les détails du paiement ou dans l'e-mail de confirmation.",
            referencePlaceholder: "Identifiant de dépôt PawaPay",
          },
          {
            id: "payout",
            label: "Paiement sortant",
            fetchStatus: getPawaPayPayoutStatus,
            fetchHistory: (params) =>
              getAdminTransactions({ ...params, provider: "PAWAPAY" }),
            referenceLabel: "Référence du paiement sortant",
            referenceHint:
              "Sélectionnez un paiement sortant récent ci-dessus, ou saisissez la référence PawaPay si vous l'avez.",
            referencePlaceholder: "Identifiant de paiement sortant",
          },
          {
            id: "refund",
            label: "Remboursement",
            fetchStatus: getPawaPayRefundStatus,
            referenceLabel: "Référence du remboursement",
            referenceHint:
              "Saisissez l'identifiant de remboursement PawaPay reçu après l'initiation d'un remboursement.",
            referencePlaceholder: "Identifiant de remboursement",
          },
        ]}
        defaultModeId="payout"
      />

      {depositResult !== null && (
        <TransactionResultCard title="Dernier résultat de dépôt" data={depositResult} />
      )}
      {payoutResult !== null && (
        <TransactionResultCard title="Dernier résultat de paiement sortant" data={payoutResult} />
      )}
      {refundResult !== null && (
        <TransactionResultCard title="Dernier résultat de remboursement" data={refundResult} />
      )}

      {canManagePayouts && (
        <>
          <PawaPayDepositDialog
            open={depositOpen}
            onOpenChange={setDepositOpen}
            onSuccess={(result) => setDepositResult(result)}
          />

          <PawaPayPayoutDialog
            open={payoutOpen}
            onOpenChange={setPayoutOpen}
            onSuccess={(result) => {
              setPayoutResult(result);
            }}
            onError={(message) =>
              setFeedback({
                open: true,
                variant: "error",
                title: "Échec du paiement sortant",
                description: message,
              })
            }
          />

          <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-destructive h-4 w-4" />
                  Remboursement manuel
                </DialogTitle>
                <DialogDescription>
                  Rembourse un dépôt complété. Commencez par vérifier le dépôt
                  concerné, puis laissez le montant vide pour rembourser la
                  totalité. Vérification par e-mail requise.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRequestRefundApproval}>
                <FieldGroup className="gap-4 py-2">
                  <Field>
                    <FieldLabel>Référence du dépôt à rembourser</FieldLabel>
                    <Input
                      value={refundForm.depositId}
                      onChange={(e) =>
                        setRefundForm((f) => ({ ...f, depositId: e.target.value }))
                      }
                      placeholder="Identifiant du dépôt PawaPay"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Montant (facultatif)</FieldLabel>
                    <Input
                      type="number"
                      step="any"
                      value={refundForm.amount}
                      onChange={(e) =>
                        setRefundForm((f) => ({ ...f, amount: e.target.value }))
                      }
                      placeholder="Remboursement total si vide"
                    />
                  </Field>
                </FieldGroup>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setRefundOpen(false)}>
                    {ui.cancel}
                  </Button>
                  <Button type="submit" variant="destructive" disabled={isRequestingRefundApproval}>
                    {isRequestingRefundApproval
                      ? "Envoi du code…"
                      : "Demander le code d'approbation"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <VerificationCodeDialog
            open={refundOtpOpen}
            onOpenChange={setRefundOtpOpen}
            type="payout-approval"
            context={refundApprovalContext ?? undefined}
            onSubmit={handleConfirmRefundOtp}
            isSubmitting={isConfirmingRefund}
            error={refundOtpError}
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
