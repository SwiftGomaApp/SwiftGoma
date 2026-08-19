"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Logo from "../global/logo";
import { RotatingCaption } from "@/lib/constants/auth";
import { DEFAULT_LOCALE, getClientLocale, Locale } from "@/lib/language";

type RecoveryStep = "request" | "verify" | "totp" | "success" | "failure";

const ACCOUNT_RECOVERY_STRINGS = {
  en: {
    requestTitle: "Recover your account",
    requestDescription:
      "Enter the email address associated with your account. We'll send you a recovery code.",

    email: "Email address",
    emailPlaceholder: "m@example.com",

    sendCode: "Send recovery code",
    sending: "Sending...",

    verifyTitle: "Verify recovery code",
    verifyDescription:
      "Enter the verification code sent to your email address.",

    code: "Recovery code",
    codePlaceholder: "Enter 6-digit code",

    verify: "Verify code",
    verifying: "Verifying...",

    totpTitle: "Two-factor verification",
    totpDescription:
      "Enter the code from your authenticator app to complete account recovery.",

    totpCode: "Authentication code",
    totpPlaceholder: "Enter 6-digit code",

    continue: "Continue",

    successTitle: "Account recovered successfully",
    successDescription:
      "Your account has been recovered and you are now signed in.",

    goToAccount: "Go to account",

    failureTitle: "Account recovery failed",
    failureDescription:
      "We couldn't complete your account recovery. Please check your information and try again.",

    tryAgain: "Try again",
    startOver: "Start over",
    back: "Back",

    rememberAccount: "Remember your account?",
    signIn: "Sign in",

    resendCode: "Resend code",

    showCode: "Show code",
    hideCode: "Hide code",

    invalidCode: "The verification code is invalid or has expired.",

    requestFailed: "We couldn't send a recovery code. Please try again.",

    verificationFailed:
      "We couldn't verify your recovery code. Please try again.",

    emailSent: "Recovery code sent to",
  },

  fr: {
    requestTitle: "Récupérer votre compte",
    requestDescription:
      "Entrez l'adresse e-mail associée à votre compte. Nous vous enverrons un code de récupération.",

    email: "Adresse e-mail",
    emailPlaceholder: "exemple@email.com",

    sendCode: "Envoyer le code de récupération",
    sending: "Envoi...",

    verifyTitle: "Vérifier le code de récupération",
    verifyDescription:
      "Entrez le code de vérification envoyé à votre adresse e-mail.",

    code: "Code de récupération",
    codePlaceholder: "Entrez le code à 6 chiffres",

    verify: "Vérifier le code",
    verifying: "Vérification...",

    totpTitle: "Vérification à deux facteurs",
    totpDescription:
      "Entrez le code de votre application d'authentification pour terminer la récupération de votre compte.",

    totpCode: "Code d'authentification",
    totpPlaceholder: "Entrez le code à 6 chiffres",

    continue: "Continuer",

    successTitle: "Compte récupéré avec succès",
    successDescription:
      "Votre compte a été récupéré et vous êtes maintenant connecté.",

    goToAccount: "Accéder à mon compte",

    failureTitle: "La récupération a échoué",
    failureDescription:
      "Nous n'avons pas pu récupérer votre compte. Vérifiez vos informations et réessayez.",

    tryAgain: "Réessayer",
    startOver: "Recommencer",
    back: "Retour",

    rememberAccount: "Vous vous souvenez de votre compte ?",
    signIn: "Se connecter",

    resendCode: "Renvoyer le code",

    showCode: "Afficher le code",
    hideCode: "Masquer le code",

    invalidCode: "Le code de vérification est incorrect ou a expiré.",

    requestFailed:
      "Impossible d'envoyer un code de récupération. Veuillez réessayer.",

    verificationFailed:
      "Impossible de vérifier votre code de récupération. Veuillez réessayer.",

    emailSent: "Code de récupération envoyé à",
  },
} as const;

export function AccountRecoveryForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [step, setStep] = useState<RecoveryStep>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = ACCOUNT_RECOVERY_STRINGS[locale];

  const handleRequestRecovery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || loading) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Requesting account recovery:", {
        email,
        locale,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStep("verify");
    } catch (error) {
      console.error(error);
      setError(t.requestFailed);
      setStep("failure");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecovery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!code || loading) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Verifying account recovery:", {
        email,
        code,
        locale,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (code === "123456") {
        setStep("success");
        return;
      }

      if (code === "222222") {
        setPendingToken("demo-pending-token");
        setStep("totp");
        return;
      }

      setError(t.invalidCode);
      setStep("failure");
    } catch (error) {
      console.error(error);

      setError(t.verificationFailed);
      setStep("failure");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!totpCode || loading) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Verifying recovery TOTP:", {
        pendingToken,
        code: totpCode,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (totpCode === "654321") {
        setStep("success");
        return;
      }

      setError(t.invalidCode);
      setStep("failure");
    } catch (error) {
      console.error(error);

      setError(t.verificationFailed);
      setStep("failure");
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setError(null);
    if (step === "failure") {
      setCode("");
      setTotpCode("");
      setStep("verify");
    }
  };

  const handleStartOver = () => {
    setStep("request");
    setEmail("");
    setCode("");
    setTotpCode("");
    setPendingToken(null);
    setError(null);
  };

  const handleBackToRequest = () => {
    setCode("");
    setError(null);
    setStep("request");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col gap-2 text-center">
          <div className="flex size-8 justify-start rounded-md">
            <Logo />
          </div>
          <span className="sr-only">SwiftGoma</span>

          {step === "request" && (
            <>
              <h1 className="mt-6 text-left text-4xl font-bold">
                {t.requestTitle}
              </h1>
              <FieldDescription className="text-left">
                {t.requestDescription}
              </FieldDescription>
            </>
          )}

          {step === "verify" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-2 w-fit gap-2 px-0"
                onClick={handleBackToRequest}
              >
                <ArrowLeft className="size-4" />
                {t.back}
              </Button>
              <h1 className="text-left text-4xl font-bold">{t.verifyTitle}</h1>
              <FieldDescription className="text-left">
                {t.verifyDescription}
              </FieldDescription>
              <p className="mt-2 text-left text-sm text-muted-foreground">
                {t.emailSent}{" "}
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </>
          )}

          {step === "totp" && (
            <>
              <div className="mt-6 flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="size-6 text-primary" />
                </div>
              </div>
              <h1 className="mt-4 text-3xl font-bold">{t.totpTitle}</h1>
              <FieldDescription>{t.totpDescription}</FieldDescription>
            </>
          )}

          {step === "success" && (
            <div className="mt-6 flex flex-col items-center">
              <CheckCircle2 className="mb-4 size-14 text-green-500" />
              <h1 className="text-3xl font-bold">{t.successTitle}</h1>
              <FieldDescription className="mt-3">
                {t.successDescription}
              </FieldDescription>
            </div>
          )}

          {step === "failure" && (
            <div className="mt-6 flex flex-col items-center">
              <XCircle className="mb-4 size-14 text-destructive" />

              <h1 className="text-3xl font-bold">{t.failureTitle}</h1>

              <FieldDescription className="mt-3">
                {error || t.failureDescription}
              </FieldDescription>
            </div>
          )}
        </div>

        {step === "request" && (
          <form onSubmit={handleRequestRecovery} className="contents">
            <Field>
              <FieldLabel htmlFor="email">{t.email}</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                autoComplete="email"
                required
                disabled={loading}
              />
            </Field>
            <Field>
              <Button
                type="submit"
                className="w-full"
                disabled={!email || loading}
              >
                {loading && <Loader2 className="size-4 animate-spin" />}

                <Mail className="size-4" />

                {loading ? t.sending : t.sendCode}
              </Button>
            </Field>
            <FieldDescription className="text-center">
              {t.rememberAccount}{" "}
              <Link
                href="/auth/sign-in"
                className="font-medium text-primary hover:underline"
              >
                {t.signIn}
              </Link>
            </FieldDescription>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerifyRecovery} className="contents">
            <Field>
              <FieldLabel htmlFor="recovery-code">{t.code}</FieldLabel>
              <Input
                id="recovery-code"
                name="code"
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder={t.codePlaceholder}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                disabled={loading}
              />
            </Field>
            <Field>
              <Button
                type="submit"
                className="w-full"
                disabled={code.length !== 6 || loading}
              >
                {loading && <Loader2 className="size-4 animate-spin" />}

                {loading ? t.verifying : t.verify}
              </Button>
            </Field>
            <Button
              type="button"
              variant="link"
              disabled={loading}
              className="mx-auto"
              onClick={async () => {
                setLoading(true);

                try {
                  await new Promise((resolve) => setTimeout(resolve, 1000));

                  console.log("Resending recovery code to:", email);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {t.resendCode}
            </Button>
          </form>
        )}

        {step === "totp" && (
          <form onSubmit={handleVerifyTotp} className="contents">
            <Field>
              <FieldLabel htmlFor="totp-code">{t.totpCode}</FieldLabel>
              <Input
                id="totp-code"
                name="totp"
                type="text"
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder={t.totpPlaceholder}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                disabled={loading}
              />
            </Field>
            <Field>
              <Button
                type="submit"
                className="w-full"
                disabled={totpCode.length !== 6 || loading}
              >
                {loading && <Loader2 className="size-4 animate-spin" />}

                <KeyRound className="size-4" />

                {loading ? t.verifying : t.continue}
              </Button>
            </Field>
          </form>
        )}

        {step === "success" && (
          <Field>
            <Button className="mt-4 w-full">
              <Link href="/dashboard">{t.goToAccount}</Link>
            </Button>
          </Field>
        )}

        {step === "failure" && (
          <>
            <Field>
              <Button type="button" className="w-full" onClick={handleTryAgain}>
                {t.tryAgain}
              </Button>
            </Field>
            <Field>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleStartOver}
              >
                <ArrowLeft className="size-4" />
                {t.startOver}
              </Button>
            </Field>
          </>
        )}
      </FieldGroup>

      <FieldDescription className="px-6 text-center">
        <RotatingCaption locale={locale} />
      </FieldDescription>
    </div>
  );
}
