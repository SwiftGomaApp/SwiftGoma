"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

export type VerificationCodeType =
  | "email"
  | "totp"
  | "login"
  | "expense-approval"
  | "payout-approval";

export interface VerificationContext {
  reference?: string;
  title?: string;
  amount?: number | string;
  currency?: string;
  beneficiary?: string;
  providerLabel?: string;
}

interface DialogCopy {
  title: string;
  description: string;
  submitLabel: string;
}

function formatAmount(amount?: number | string, currency?: string) {
  if (amount == null || amount === "") return null;
  return currency ? `${amount} ${currency}` : String(amount);
}

function buildDialogCopy(
  type: VerificationCodeType,
  context?: VerificationContext,
): DialogCopy {
  const amountLabel = formatAmount(context?.amount, context?.currency);

  switch (type) {
    case "expense-approval":
      return {
        title: "Approuver la dépense",
        description: [
          "Saisissez le code à 6 chiffres envoyé à votre e-mail administrateur pour approuver",
          context?.reference ? `la dépense ${context.reference}` : "cette dépense",
          context?.title ? `« ${context.title} »` : null,
          amountLabel ? `(${amountLabel})` : null,
          context?.beneficiary ? `vers ${context.beneficiary}` : null,
          "et déclencher le paiement PawaPay.",
        ]
          .filter(Boolean)
          .join(" "),
        submitLabel: "Approuver et payer",
      };

    case "payout-approval":
      return {
        title: "Approuver le paiement sortant",
        description: [
          "Saisissez le code à 6 chiffres envoyé à votre e-mail administrateur pour confirmer",
          amountLabel ? `l'envoi de ${amountLabel}` : "ce paiement sortant",
          context?.beneficiary ? `vers ${context.beneficiary}` : null,
          context?.providerLabel ? `via ${context.providerLabel}.` : ".",
        ]
          .filter(Boolean)
          .join(" "),
        submitLabel: "Confirmer le paiement",
      };

    case "totp":
      return {
        title: "Code d'authentification",
        description:
          "Ouvrez votre application d'authentification et saisissez le code à 6 chiffres pour continuer.",
        submitLabel: "Vérifier",
      };

    case "login":
      return {
        title: "Code de connexion",
        description:
          "Saisissez le code à 6 chiffres que nous avons envoyé pour confirmer votre identité.",
        submitLabel: "Vérifier",
      };

    case "email":
    default:
      return {
        title: "Vérifiez votre e-mail",
        description:
          "Saisissez le code à 6 chiffres que nous venons d'envoyer à votre adresse e-mail.",
        submitLabel: "Vérifier",
      };
  }
}

const RESEND_COOLDOWN_SECONDS = 60;

interface VerificationCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: VerificationCodeType;
  context?: VerificationContext;
  onSubmit: (code: string) => void | Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
  onResend?: () => void | Promise<void>;
  resendLabel?: string;
}

export function VerificationCodeDialog({
  open,
  onOpenChange,
  type,
  context,
  onSubmit,
  isSubmitting = false,
  error,
  onResend,
  resendLabel = "Renvoyer le code",
}: VerificationCodeDialogProps) {
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const copy = buildDialogCopy(type, context);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setCode("");
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    }
  }

  useEffect(() => {
    if (!open || !onResend || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [open, onResend, secondsLeft]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setCode("");
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (code.length !== 6) return;
    await onSubmit(code);
  };

  const handleResendClick = async () => {
    if (secondsLeft > 0 || !onResend) return;
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    await onResend();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={isSubmitting}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="h-14 w-12 text-lg" />
              <InputOTPSlot index={1} className="h-14 w-12 text-lg" />
              <InputOTPSlot index={2} className="h-14 w-12 text-lg" />
              <InputOTPSlot index={3} className="h-14 w-12 text-lg" />
              <InputOTPSlot index={4} className="h-14 w-12 text-lg" />
              <InputOTPSlot index={5} className="h-14 w-12 text-lg" />
            </InputOTPGroup>
          </InputOTP>

          {error && <p className="text-destructive text-sm">{error}</p>}

          {onResend && (
            <button
              type="button"
              onClick={handleResendClick}
              disabled={isSubmitting || secondsLeft > 0}
              className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
            >
              {secondsLeft > 0
                ? `${resendLabel} dans ${secondsLeft} s`
                : resendLabel}
            </button>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            className="w-full"
            disabled={code.length !== 6 || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Vérification…" : copy.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
