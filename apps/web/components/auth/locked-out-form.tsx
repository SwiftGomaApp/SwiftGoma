"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OtpDialog, type OtpStatus } from "@/components/auth/modals/otp-dialog";
import { toast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/client";
import {
  requestPhoneAccountRecovery,
  confirmPhoneAccountRecovery,
} from "@/lib/api/routes/auth.routes";
import { DEFAULT_LOCALE, getClientLocale, type Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Locked out of your account?",
    description:
      "Enter the phone number on your account. We'll text you a code, and confirming it will sign you out of every device, remove your password, and remove any two-factor method or passkey — so you can get back in with a fresh start.",
    phoneLabel: "Phone number",
    phonePlaceholder: "+243999999999",
    sendCode: "Send code",
    sending: "Sending...",
    otpTitle: "Confirm it's you",
    otpDescription: "Enter the code we texted you to secure your account.",
    successTitle: "Account secured",
    successDescription:
      "Every device has been signed out. Sign in again to set a new password.",
    successButton: "Go to sign in",
    genericError: "Something went wrong. Please try again.",
    invalidPhone: "Enter a valid phone number, e.g. +243999999999.",
    backToSignIn: "Back to sign in",
  },
  fr: {
    title: "Verrouillé hors de votre compte ?",
    description:
      "Entrez le numéro de téléphone associé à votre compte. Nous vous enverrons un code par SMS, et sa confirmation vous déconnectera de tous les appareils, supprimera votre mot de passe, et supprimera toute méthode à deux facteurs ou clé d'accès — afin que vous puissiez repartir à zéro.",
    phoneLabel: "Numéro de téléphone",
    phonePlaceholder: "+243999999999",
    sendCode: "Envoyer le code",
    sending: "Envoi...",
    otpTitle: "Confirmez que c'est vous",
    otpDescription:
      "Entrez le code envoyé par SMS pour sécuriser votre compte.",
    successTitle: "Compte sécurisé",
    successDescription:
      "Tous les appareils ont été déconnectés. Reconnectez-vous pour définir un nouveau mot de passe.",
    successButton: "Aller à la connexion",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    invalidPhone: "Entrez un numéro de téléphone valide, ex. +243999999999.",
    backToSignIn: "Retour à la connexion",
  },
} as const;

function extractMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}

const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

export function LockedOutForm() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = STRINGS[locale];

  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  async function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!PHONE_PATTERN.test(phone.trim())) {
      toast.add({ title: t.invalidPhone, type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await requestPhoneAccountRecovery(phone.trim());
      setOtpStatus("idle");
      setOtpOpen(true);
    } catch (err) {
      toast.add({
        title: t.genericError,
        description: extractMessage(err, t.genericError),
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(code: string) {
    setOtpLoading(true);
    setOtpStatus("idle");
    try {
      await confirmPhoneAccountRecovery({ phone: phone.trim(), code });
      setOtpStatus("success");
    } catch (err) {
      setErrorMessage(extractMessage(err, t.genericError));
      setOtpStatus("error");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      await requestPhoneAccountRecovery(phone.trim());
    } catch {
      // ignore — resend cooldown UI already covers repeat clicks
    } finally {
      setResendLoading(false);
    }
  }

  function handleSuccessAction() {
    setOtpOpen(false);
    router.push("/auth/sign-in");
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
        <ShieldAlert className="size-8 text-destructive" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>

      <form onSubmit={handleSendCode} className="w-full">
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel htmlFor="recovery-phone">{t.phoneLabel}</FieldLabel>
            <Input
              id="recovery-phone"
              type="tel"
              autoComplete="tel"
              placeholder={t.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          <Button
            type="submit"
            variant="destructive"
            className="w-full font-semibold"
            disabled={submitting || !phone.trim()}
          >
            {submitting ? t.sending : t.sendCode}
          </Button>
        </FieldGroup>
      </form>

      <Link
        href="/auth/sign-in"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {t.backToSignIn}
      </Link>

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
    </div>
  );
}

export default LockedOutForm;
