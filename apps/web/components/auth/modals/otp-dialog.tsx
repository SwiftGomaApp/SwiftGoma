"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, Locale } from "@/lib/language";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export type OtpMode = "totp" | "2fa" | "email-verification" | "otp-login";

export type OtpStatus = "idle" | "error" | "success";

type OtpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  mode: OtpMode;
  locale?: Locale;

  onSubmit?: (code: string) => void;
  onResend?: () => void;
  onUseBackupCode?: (code: string) => void;

  loading?: boolean;

  status?: OtpStatus;

  onStatusChange?: (status: OtpStatus) => void;

  errorMessage?: string;

  onSuccessAction?: () => void;
  successButtonLabel?: string;
  successTitle?: string;
  successDescription?: string;

  email?: string;
  title?: string;
  description?: string;
};

const OTP_STRINGS = {
  en: {
    totp: {
      title: "Verify your identity",
      description:
        "Enter the 6-digit code from your authenticator app to continue.",
      button: "Verify code",
      backupLink: "Can't access your authenticator?",
    },

    twoFactor: {
      title: "Two-factor authentication",
      description:
        "Enter the verification code from your authenticator app to securely continue.",
      button: "Verify and continue",
      backupLink: "Can't access your authenticator?",
    },

    emailVerification: {
      title: "Verify your email",
      description:
        "We've sent a verification code to your email address. Enter the code below to verify your account.",
      button: "Verify email",
      resend: "Didn't receive the code?",
      resendAction: "Resend code",
    },

    otpLogin: {
      title: "Enter your login code",
      description:
        "We've sent a one-time code to your email address. Enter it below to continue signing in.",
      button: "Continue",
      resend: "Didn't receive the code?",
      resendAction: "Resend code",
    },

    backup: {
      title: "Use a backup code",
      description:
        "Enter one of your backup codes to verify your identity and continue.",
      button: "Verify backup code",
      back: "Use authenticator code instead",
    },

    success: {
      title: "Verification successful",
      description: "Your code has been verified successfully.",
      button: "Continue",
    },

    common: {
      verifying: "Verifying...",
      emailSentTo: "We sent the code to",
      resendIn: "Resend code in",
      invalidCode: "The code you entered is incorrect. Please try again.",
    },
  },

  fr: {
    totp: {
      title: "Vérifiez votre identité",
      description:
        "Entrez le code à 6 chiffres de votre application d'authentification pour continuer.",
      button: "Vérifier le code",
      backupLink: "Vous n'avez pas accès à votre application ?",
    },

    twoFactor: {
      title: "Authentification à deux facteurs",
      description:
        "Entrez le code de vérification de votre application d'authentification pour continuer en toute sécurité.",
      button: "Vérifier et continuer",
      backupLink: "Vous n'avez pas accès à votre application ?",
    },

    emailVerification: {
      title: "Vérifiez votre adresse e-mail",
      description:
        "Nous avons envoyé un code de vérification à votre adresse e-mail. Entrez le code ci-dessous pour vérifier votre compte.",
      button: "Vérifier l'e-mail",
      resend: "Vous n'avez pas reçu le code ?",
      resendAction: "Renvoyer le code",
    },

    otpLogin: {
      title: "Entrez votre code de connexion",
      description:
        "Nous avons envoyé un code à usage unique à votre adresse e-mail. Entrez-le ci-dessous pour continuer.",
      button: "Continuer",
      resend: "Vous n'avez pas reçu le code ?",
      resendAction: "Renvoyer le code",
    },

    backup: {
      title: "Utiliser un code de récupération",
      description:
        "Entrez l'un de vos codes de récupération pour vérifier votre identité et continuer.",
      button: "Vérifier le code",
      back: "Utiliser le code de l'application à la place",
    },

    success: {
      title: "Vérification réussie",
      description: "Votre code a été vérifié avec succès.",
      button: "Continuer",
    },

    common: {
      verifying: "Vérification...",
      emailSentTo: "Nous avons envoyé le code à",
      resendIn: "Renvoyer le code dans",
      invalidCode: "Le code que vous avez entré est incorrect. Réessayez.",
    },
  },
} as const;

const OTP_LENGTH = 6;
const BACKUP_CODE_LENGTH = 8;
const RESEND_COOLDOWN_SECONDS = 30;

export function OtpDialog({
  open,
  onOpenChange,
  mode,
  locale = DEFAULT_LOCALE,
  onSubmit,
  onResend,
  onUseBackupCode,
  loading = false,
  status = "idle",
  onStatusChange,
  errorMessage,
  onSuccessAction,
  successButtonLabel,
  successTitle,
  successDescription,
  email,
  title,
  description,
}: OtpDialogProps) {
  const [code, setCode] = useState("");
  const [usingBackupCode, setUsingBackupCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const t = OTP_STRINGS[locale];

  const canUseBackupCode = mode === "totp" || mode === "2fa";

  const isBackupCode = canUseBackupCode && usingBackupCode;

  const otpLength = isBackupCode ? BACKUP_CODE_LENGTH : OTP_LENGTH;

  const hasError = status === "error";
  const isSuccess = status === "success";

  /*
   * Reset code whenever the authentication mode changes.
   */
  useEffect(() => {
    setCode("");
    setUsingBackupCode(false);
  }, [mode]);

  /*
   * Start or restart resend cooldown.
   */
  useEffect(() => {
    if (open && (mode === "email-verification" || mode === "otp-login")) {
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } else {
      setResendCooldown(0);
    }
  }, [open, mode]);

  /*
   * Countdown timer.
   */
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  /*
   * Reset dialog state when closed.
   */
  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setCode("");
      setUsingBackupCode(false);
    }

    onOpenChange(value);
  };

  /*
   * Get content according to the current mode.
   */
  const getContent = (): {
    title: string;
    description: string;
    button: string;
    backupLink?: string;
    resend?: string;
    resendAction?: string;
    back?: string;
  } => {
    if (isBackupCode) {
      return t.backup;
    }

    switch (mode) {
      case "totp":
        return t.totp;

      case "2fa":
        return t.twoFactor;

      case "email-verification":
        return t.emailVerification;

      case "otp-login":
        return t.otpLogin;
    }
  };

  const content = getContent();

  /*
   * Icon according to authentication state.
   */
  const Icon = isBackupCode
    ? KeyRound
    : mode === "email-verification" || mode === "otp-login"
      ? Mail
      : ShieldCheck;

  /*
   * Handle OTP / backup code input.
   */
  const handleCodeChange = (value: string) => {
    if (status === "error") {
      onStatusChange?.("idle");
    }

    if (isBackupCode) {
      const sanitized = value
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, BACKUP_CODE_LENGTH)
        .toUpperCase();

      setCode(sanitized);
      return;
    }

    const numericValue = value.replace(/\D/g, "").slice(0, OTP_LENGTH);

    setCode(numericValue);
  };

  /*
   * Submit OTP or backup code.
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCode = code.trim();

    if (!trimmedCode) return;

    if (isBackupCode) {
      onUseBackupCode?.(trimmedCode);
      return;
    }

    onSubmit?.(trimmedCode);
  };

  /*
   * Resend the code.
   */
  const handleResendClick = () => {
    if (loading || resendCooldown > 0) return;

    onResend?.();

    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const isSubmitDisabled =
    loading ||
    (isBackupCode
      ? code.length !== BACKUP_CODE_LENGTH
      : code.length !== OTP_LENGTH);

  /*
   * Success screen.
   */
  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-105">
          <div className="space-y-6 py-4 text-center">
            <div className="flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {successTitle ?? t.success.title}
              </DialogTitle>

              <DialogDescription className="mx-auto max-w-[32ch] text-center text-sm leading-relaxed">
                {successDescription ?? t.success.description}
              </DialogDescription>
            </div>

            <Button
              type="button"
              className="h-11 w-full font-semibold"
              onClick={onSuccessAction}
            >
              {successButtonLabel ?? t.success.button}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-105">
        <DialogHeader className="items-center gap-1 text-center">
          {/* Icon */}
          <div
            className={cn(
              "mb-2 flex size-14 items-center justify-center rounded-full",
              hasError
                ? "bg-destructive/10 ring-1 ring-destructive/15"
                : "bg-primary/10 ring-1 ring-primary/15",
            )}
          >
            <Icon
              className={cn(
                "size-6",
                hasError ? "text-destructive" : "text-primary",
              )}
              strokeWidth={2}
            />
          </div>

          {/* Title */}
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {title ?? content.title}
          </DialogTitle>

          {/* Description */}
          <DialogDescription className="max-w-[30ch] text-balance text-center text-sm leading-relaxed">
            {description ?? content.description}

            {email && !isBackupCode && (
              <span className="mt-1.5 block truncate font-medium text-foreground">
                {t.common.emailSentTo} {email}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-6">
          {/* OTP / Backup code */}
          <div className="flex w-full flex-col items-center py-2">
            <InputOTP
              key={isBackupCode ? "backup" : "otp"}
              maxLength={otpLength}
              value={code}
              onChange={handleCodeChange}
              disabled={loading}
              autoFocus
            >
              <InputOTPGroup className={cn("gap-2", isBackupCode && "gap-1.5")}>
                {Array.from({
                  length: otpLength,
                }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className={cn(
                      "size-11 rounded-lg border text-lg font-semibold shadow-sm transition-colors sm:size-12 sm:text-xl",

                      "data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/20",

                      isBackupCode && "size-8 text-sm sm:size-9",

                      hasError &&
                        "border-destructive text-destructive ring-1 ring-destructive/30 data-[active=true]:border-destructive data-[active=true]:ring-destructive/30",
                    )}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {/* Wrong code message */}
            {hasError && (
              <p
                role="alert"
                className="mt-3 text-center text-sm font-medium text-destructive"
              >
                {errorMessage ?? t.common.invalidCode}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="h-11 w-full font-semibold"
            disabled={isSubmitDisabled}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}

            {loading ? t.common.verifying : content.button}
          </Button>

          {/* Secondary actions */}
          {((canUseBackupCode && !usingBackupCode) ||
            isBackupCode ||
            (!isBackupCode &&
              (mode === "email-verification" || mode === "otp-login"))) && (
            <div className="flex flex-col items-center gap-3 border-t pt-4 text-center">
              {/* TOTP / 2FA → Backup code */}
              {canUseBackupCode && !usingBackupCode && (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm font-medium text-muted-foreground hover:text-foreground"
                  disabled={loading}
                  onClick={() => {
                    setCode("");
                    setUsingBackupCode(true);
                  }}
                >
                  {mode === "totp" ? t.totp.backupLink : t.twoFactor.backupLink}
                </Button>
              )}

              {/* Backup code → Authenticator */}
              {isBackupCode && (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto gap-1.5 p-0 text-sm font-medium text-muted-foreground hover:text-foreground"
                  disabled={loading}
                  onClick={() => {
                    setCode("");
                    setUsingBackupCode(false);
                  }}
                >
                  <ArrowLeft className="size-3.5" />

                  {t.backup.back}
                </Button>
              )}

              {/* Resend */}
              {!isBackupCode &&
                (mode === "email-verification" || mode === "otp-login") && (
                  <p className="text-sm text-muted-foreground">
                    <span>{content.resend} </span>

                    <button
                      type="button"
                      onClick={handleResendClick}
                      disabled={loading || resendCooldown > 0}
                      className="font-medium text-primary underline-offset-4 transition-colors hover:underline disabled:pointer-events-none disabled:text-muted-foreground disabled:no-underline"
                    >
                      {resendCooldown > 0
                        ? `${t.common.resendIn} ${resendCooldown}s`
                        : content.resendAction}
                    </button>
                  </p>
                )}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
