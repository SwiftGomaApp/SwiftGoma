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

export type VerificationCodeType = "email" | "totp" | "login";

const CODE_COPY: Record<
  VerificationCodeType,
  { title: string; description: string }
> = {
  email: {
    title: "Verify your email",
    description: "Enter the 6-digit code we just sent to your email address.",
  },
  totp: {
    title: "Enter authenticator code",
    description:
      "Open your authenticator app and enter the 6-digit code to continue.",
  },
  login: {
    title: "Enter login code",
    description: "Enter the 6-digit code we sent to confirm it's you.",
  },
};

const RESEND_COOLDOWN_SECONDS = 60;

interface VerificationCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: VerificationCodeType;
  onSubmit: (code: string) => void | Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
  // Optional — TOTP codes come from an authenticator app, so there's
  // nothing to "resend"; email/login OTPs usually want this.
  onResend?: () => void | Promise<void>;
  resendLabel?: string;
}

export function VerificationCodeDialog({
  open,
  onOpenChange,
  type,
  onSubmit,
  isSubmitting = false,
  error,
  onResend,
  resendLabel = "Resend code",
}: VerificationCodeDialogProps) {
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const copy = CODE_COPY[type];

  // Reset the code input and restart the cooldown every time the dialog
  // opens — covers both "just requested a fresh code" and re-opening
  // after a previous attempt.
  useEffect(() => {
    if (open) {
      setCode("");
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    }
  }, [open]);

  // Ticks down once per second while the dialog is open and there's an
  // onResend handler to gate. No interval at all for TOTP (no resend
  // concept), so nothing runs needlessly in that mode.
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
                ? `${resendLabel} in ${secondsLeft}s`
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
            {isSubmitting ? "Verifying..." : "Verify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
