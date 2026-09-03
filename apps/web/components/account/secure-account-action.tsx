"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { OtpDialog, type OtpStatus } from "@/components/auth/modals/otp-dialog";
import { toast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/client";
import {
  confirmSecureAccount,
  requestSecureAccountOtp,
} from "@/lib/api/routes/auth.routes";
import type { Locale } from "@/lib/language";
import { useAuth } from "@/lib/auth/auth-context";

const STRINGS = {
  en: {
    trigger: "Secure my account",
    wasntMeTrigger: "This wasn't me",
    confirmTitle: "Secure your account?",
    confirmDescription:
      "This will sign you out of every device, remove your password, and remove any two-factor method or passkey on the account. You'll need to set a new password to sign back in.",
    confirmCancel: "Cancel",
    confirmContinue: "Continue",
    otpTitle: "Confirm it's you",
    otpDescription:
      "Enter the code we sent to confirm you want to secure your account.",
    successTitle: "Account secured",
    successDescription:
      "Every device has been signed out. Sign in again to set a new password.",
    successButton: "Go to sign in",
    genericError: "Something went wrong. Please try again.",
  },
  fr: {
    trigger: "Sécuriser mon compte",
    wasntMeTrigger: "Ce n'était pas moi",
    confirmTitle: "Sécuriser votre compte ?",
    confirmDescription:
      "Cela vous déconnectera de tous les appareils, supprimera votre mot de passe, et supprimera toute méthode à deux facteurs ou clé d'accès sur le compte. Vous devrez définir un nouveau mot de passe pour vous reconnecter.",
    confirmCancel: "Annuler",
    confirmContinue: "Continuer",
    otpTitle: "Confirmez que c'est vous",
    otpDescription:
      "Entrez le code que nous avons envoyé pour confirmer que vous souhaitez sécuriser votre compte.",
    successTitle: "Compte sécurisé",
    successDescription:
      "Tous les appareils ont été déconnectés. Reconnectez-vous pour définir un nouveau mot de passe.",
    successButton: "Aller à la connexion",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
  },
} as const;

function extractMessage(err: unknown): string | undefined {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return undefined;
}

export function SecureAccountAction({
  locale,
  variant = "general",
}: {
  locale: Locale;
  variant?: "general" | "wasnt-me";
}) {
  const t = STRINGS[locale];
  const router = useRouter();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const { setUser } = useAuth();

  async function handleConfirm() {
    setConfirmOpen(false);
    try {
      await requestSecureAccountOtp({ locale });
      setOtpStatus("idle");
      setOtpOpen(true);
    } catch (err) {
      toast.add({
        title: t.genericError,
        description: extractMessage(err),
        type: "error",
      });
    }
  }

  async function handleOtpSubmit(code: string) {
    setOtpLoading(true);
    setOtpStatus("idle");
    try {
      await confirmSecureAccount({ code });
      setOtpStatus("success");
    } catch (err) {
      setErrorMessage(extractMessage(err));
      setOtpStatus("error");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      await requestSecureAccountOtp({ locale });
    } catch {
      // ignore — the resend cooldown UI already covers repeat clicks
    } finally {
      setResendLoading(false);
    }
  }

  function handleSuccessAction() {
    setOtpOpen(false);
    setUser(null);
    router.push("/auth/sign-in");
  }

  return (
    <>
      <Button
        type="button"
        variant={variant === "wasnt-me" ? "outline" : "destructive"}
        size={variant === "wasnt-me" ? "sm" : "default"}
        className="gap-2"
        onClick={() => setConfirmOpen(true)}
      >
        {variant === "wasnt-me" ? null : <ShieldAlert className="size-4" />}
        {variant === "wasnt-me" ? t.wasntMeTrigger : t.trigger}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.confirmCancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {t.confirmContinue}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OtpDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        mode="otp-login"
        locale={locale}
        loading={otpLoading}
        resendLoading={resendLoading}
        status={otpStatus}
        onStatusChange={setOtpStatus}
        errorMessage={errorMessage}
        title={t.otpTitle}
        description={t.otpDescription}
        onSubmit={handleOtpSubmit}
        onResend={handleResend}
        successTitle={t.successTitle}
        successDescription={t.successDescription}
        successButtonLabel={t.successButton}
        onSuccessAction={handleSuccessAction}
      />
    </>
  );
}

export default SecureAccountAction;
