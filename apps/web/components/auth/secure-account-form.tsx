"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ShieldAlert, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/client";
import { confirmSecureAccountByLink } from "@/lib/api/routes/auth.routes";
import { DEFAULT_LOCALE, getClientLocale, type Locale } from "@/lib/language";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";

type Status = "confirm" | "loading" | "success" | "error";

const STRINGS = {
  en: {
    title: "Secure your account",
    description:
      "This will sign you out of every device, remove your password, and remove any two-factor method or passkey on the account. You'll need to set a new password to sign back in.",
    continueButton: "Yes, secure my account",
    cancelLink: "Never mind, take me home",
    successTitle: "Account secured",
    successDescription:
      "Every device has been signed out. Sign in again to set a new password.",
    successButton: "Go to sign in",
    errorTitle: "This link isn't valid",
    errorDescription:
      "This link is invalid, expired, or has already been used. If you still think your account is compromised, request a new one from the security page after signing in.",
    errorButton: "Go to sign in",
    missingToken: "This link is missing its security token.",
  },
  fr: {
    title: "Sécuriser votre compte",
    description:
      "Cela vous déconnectera de tous les appareils, supprimera votre mot de passe, et supprimera toute méthode à deux facteurs ou clé d'accès sur le compte. Vous devrez définir un nouveau mot de passe pour vous reconnecter.",
    continueButton: "Oui, sécuriser mon compte",
    cancelLink: "Annuler, retour à l'accueil",
    successTitle: "Compte sécurisé",
    successDescription:
      "Tous les appareils ont été déconnectés. Reconnectez-vous pour définir un nouveau mot de passe.",
    successButton: "Aller à la connexion",
    errorTitle: "Ce lien n'est pas valide",
    errorDescription:
      "Ce lien est invalide, expiré, ou a déjà été utilisé. Si vous pensez toujours que votre compte est compromis, demandez-en un nouveau depuis la page de sécurité après vous être connecté.",
    errorButton: "Aller à la connexion",
    missingToken: "Ce lien ne contient pas de jeton de sécurité.",
  },
} as const;

function extractMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}

export function SecureAccountForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { setUser } = useAuth();

  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [status, setStatus] = useState<Status>(token ? "confirm" : "error");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = STRINGS[locale];

  async function handleConfirm() {
    if (!token) return;
    setStatus("loading");
    try {
      await confirmSecureAccountByLink({ token });
      setUser(null);
      setStatus("success");
    } catch (err) {
      setErrorMessage(extractMessage(err, t.errorDescription));
      setStatus("error");
    }
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">
            {t.successTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.successDescription}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/auth/sign-in" />}
          className="w-full font-semibold"
        >
          {t.successButton}
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
          <XCircle className="size-8 text-destructive" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">
            {t.errorTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {token ? errorMessage || t.errorDescription : t.missingToken}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/auth/sign-in" />}
          className="w-full font-semibold"
        >
          {t.errorButton}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
        <ShieldAlert className="size-8 text-destructive" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>
      <Button
        type="button"
        variant="destructive"
        className="w-full font-semibold"
        onClick={handleConfirm}
      >
        {t.continueButton}
      </Button>
      <Link
        href="/"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {t.cancelLink}
      </Link>
    </div>
  );
}

export default SecureAccountForm;
