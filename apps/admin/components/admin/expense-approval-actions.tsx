"use client";

import { useState } from "react";
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
  confirmExpenseApproval,
  rejectExpense,
  requestExpenseApproval,
  resendExpenseApproval,
  type ExpenseRecord,
} from "@/lib/api/routes/expenses";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { VerificationCodeDialog } from "@/components/dialogs/codes-dialog";
import { getErrorMessage } from "@/lib/get-error-message";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ui } from "@/lib/i18n/common";

interface ExpenseApprovalActionsProps {
  expense: ExpenseRecord;
  onUpdated: () => void;
}

export function ExpenseApprovalActions({
  expense,
  onUpdated,
}: ExpenseApprovalActionsProps) {
  const confirm = useConfirm();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [approvalContext, setApprovalContext] = useState<{
    reference: string;
    title: string;
    amount: number | string;
    currency: string;
    beneficiary: string;
  } | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const canApprove = expense.status === "PENDING" || expense.status === "FAILED";
  const isRetry = expense.status === "FAILED";

  if (!canApprove) {
    return null;
  }

  async function handleApproveRequest() {
    const ok = await confirm({
      title: isRetry ? "Réessayer le paiement" : "Approuver et payer la dépense",
      description: isRetry
        ? `Relancer le paiement PawaPay pour « ${expense.title} » (${expense.amount} ${expense.currency}) ? Un nouveau code OTP sera envoyé.`
        : `Approuver « ${expense.title} » (${expense.amount} ${expense.currency}) vers ${expense.vendorName} ? Un code OTP sera envoyé à votre e-mail.`,
      confirmLabel: "Envoyer le code",
      destructive: true,
    });
    if (!ok) return;

    setIsRequesting(true);
    setOtpError(null);
    try {
      const result = await requestExpenseApproval(expense.id);
      setPendingId(result.pendingId);
      setApprovalContext({
        reference: result.summary.reference,
        title: result.summary.title,
        amount: result.summary.amount,
        currency: result.summary.currency,
        beneficiary: result.summary.vendorName,
      });
      setOtpOpen(true);
      showSuccessToast("Code envoyé", result.message);
    } catch (err) {
      showErrorToast(
        "Échec",
        getErrorMessage(err, "Impossible de demander l'approbation."),
      );
    } finally {
      setIsRequesting(false);
    }
  }

  async function handleResendOtp() {
    if (!pendingId) return;
    setIsResending(true);
    setOtpError(null);
    try {
      const result = await resendExpenseApproval(expense.id, { pendingId });
      setPendingId(result.pendingId);
      showSuccessToast("Code renvoyé", result.message);
    } catch (err) {
      const message = getErrorMessage(err, "Impossible de renvoyer le code.");
      setOtpError(message);
      showErrorToast("Échec", message);
    } finally {
      setIsResending(false);
    }
  }

  async function handleConfirmOtp(code: string) {
    if (!pendingId) return;
    setIsConfirming(true);
    setOtpError(null);
    try {
      await confirmExpenseApproval(expense.id, { pendingId, code });
      setOtpOpen(false);
      setPendingId(null);
      setApprovalContext(null);
      showSuccessToast(
        "Dépense approuvée",
        "Le paiement PawaPay a été initié. Vous serez notifié une fois le paiement finalisé.",
      );
      onUpdated();
    } catch (err) {
      setOtpError(getErrorMessage(err, "Code invalide ou expiré."));
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      await rejectExpense(expense.id, rejectReason.trim());
      setRejectOpen(false);
      setRejectReason("");
      showSuccessToast("Dépense rejetée");
      onUpdated();
    } catch (err) {
      showErrorToast(
        "Échec",
        getErrorMessage(err, "Impossible de rejeter la dépense."),
      );
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        {expense.status === "PENDING" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRejectOpen(true)}
          >
            Rejeter
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={isRequesting}
          onClick={handleApproveRequest}
        >
          {isRequesting ? "…" : isRetry ? "Réessayer" : "Approuver"}
        </Button>
      </div>

      <VerificationCodeDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        type="expense-approval"
        context={
          approvalContext
            ? {
                reference: approvalContext.reference,
                title: approvalContext.title,
                amount: approvalContext.amount,
                currency: approvalContext.currency,
                beneficiary: approvalContext.beneficiary,
              }
            : {
                reference: expense.reference,
                title: expense.title,
                amount: expense.amount,
                currency: expense.currency,
                beneficiary: expense.vendorName,
              }
        }
        onSubmit={handleConfirmOtp}
        isSubmitting={isConfirming || isResending}
        error={otpError}
        onResend={pendingId ? handleResendOtp : undefined}
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeter la dépense</DialogTitle>
            <DialogDescription>
              Indiquez le motif de rejet pour {expense.reference}.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motif du rejet"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              {ui.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isRejecting || !rejectReason.trim()}
              onClick={handleReject}
            >
              {isRejecting ? "Rejet…" : "Confirmer le rejet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
