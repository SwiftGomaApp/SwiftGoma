"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
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

type ForgotPasswordState = "forgot" | "reset" | "success" | "failure";

const FORGOT_PASSWORD_STRINGS = {
  en: {
    forgotTitle: "Forgot password?",
    forgotDescription:
      "Enter your email address and we'll send you a verification code to reset your password.",

    email: "Email",
    emailPlaceholder: "m@example.com",

    sendCode: "Send verification code",
    sending: "Sending...",

    resetTitle: "Reset password",
    resetDescription:
      "Enter the verification code sent to your email and choose a new password.",

    code: "Verification code",
    codePlaceholder: "Enter your code",

    newPassword: "New password",
    newPasswordPlaceholder: "Enter your new password",

    confirmPassword: "Confirm password",
    confirmPasswordPlaceholder: "Confirm your new password",

    resetPassword: "Reset password",
    resetting: "Resetting...",

    passwordsDoNotMatch: "Passwords do not match.",

    successTitle: "Password reset successfully!",
    successDescription:
      "Your password has been updated successfully. You can now sign in with your new password.",

    signIn: "Sign in",

    failureTitle: "Something went wrong",
    failureDescription:
      "We couldn't complete your password reset. Please check your information and try again.",

    tryAgain: "Try again",
    back: "Back",

    rememberPassword: "Remember your password?",

    hidePassword: "Hide password",
    showPassword: "Show password",
  },

  fr: {
    forgotTitle: "Mot de passe oublié ?",
    forgotDescription:
      "Entrez votre adresse e-mail et nous vous enverrons un code de vérification pour réinitialiser votre mot de passe.",

    email: "E-mail",
    emailPlaceholder: "exemple@email.com",

    sendCode: "Envoyer le code de vérification",
    sending: "Envoi...",

    resetTitle: "Réinitialiser le mot de passe",
    resetDescription:
      "Entrez le code de vérification envoyé à votre adresse e-mail et choisissez un nouveau mot de passe.",

    code: "Code de vérification",
    codePlaceholder: "Entrez votre code",

    newPassword: "Nouveau mot de passe",
    newPasswordPlaceholder: "Entrez votre nouveau mot de passe",

    confirmPassword: "Confirmer le mot de passe",
    confirmPasswordPlaceholder: "Confirmez votre nouveau mot de passe",

    resetPassword: "Réinitialiser le mot de passe",
    resetting: "Réinitialisation...",

    passwordsDoNotMatch: "Les mots de passe ne correspondent pas.",

    successTitle: "Mot de passe réinitialisé !",
    successDescription:
      "Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",

    signIn: "Se connecter",

    failureTitle: "Une erreur est survenue",
    failureDescription:
      "Nous n'avons pas pu réinitialiser votre mot de passe. Vérifiez vos informations et réessayez.",

    tryAgain: "Réessayer",
    back: "Retour",

    rememberPassword: "Vous vous souvenez de votre mot de passe ?",

    hidePassword: "Masquer le mot de passe",
    showPassword: "Afficher le mot de passe",
  },
} as const;

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  const [step, setStep] = useState<ForgotPasswordState>("forgot");

  const [email, setEmail] = useState("");

  const [code, setCode] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = FORGOT_PASSWORD_STRINGS[locale];

  /**
   * STEP 1
   *
   * Request password reset code.
   */
  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || loading) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Forgot password request:", {
        email,
        locale,
      });

      // Replace this simulation with:
      //
      // await authApi.forgotPassword({
      //   email,
      //   locale,
      // });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStep("reset");
    } catch (error) {
      console.error(error);

      setError("Unable to send the verification code.");

      setStep("failure");
    } finally {
      setLoading(false);
    }
  };

  /**
   * STEP 2
   *
   * Verify code and reset password.
   */
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    if (newPassword !== confirmPassword) {
      setError(t.passwordsDoNotMatch);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Reset password request:", {
        email,
        code,
        newPassword,
        locale,
      });

      // Replace this simulation with:
      //
      // await authApi.resetPassword({
      //   email,
      //   code,
      //   newPassword,
      //   locale,
      // });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      /**
       * TESTING:
       *
       * 123456 = success
       * anything else = failure
       */
      if (code === "123456") {
        setStep("success");
      } else {
        setError(
          locale === "fr"
            ? "Le code de vérification est incorrect ou a expiré."
            : "The verification code is incorrect or has expired.",
        );

        setStep("failure");
      }
    } catch (error) {
      console.error(error);

      setError(
        locale === "fr"
          ? "Impossible de réinitialiser votre mot de passe."
          : "Unable to reset your password.",
      );

      setStep("failure");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Go back to reset form.
   */
  const handleTryAgain = () => {
    setError(null);
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setStep("reset");
  };

  /**
   * Start the entire flow again.
   */
  const handleStartOver = () => {
    setError(null);
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setStep("forgot");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        {/* Logo */}
        <div className="flex flex-col gap-2 text-center">
          <div className="flex flex-col gap-2 font-medium">
            <div className="flex size-8 justify-start rounded-md">
              <Logo />
            </div>

            <span className="sr-only">SwiftGoma</span>
          </div>

          {/* =========================
              STATE 1: FORGOT PASSWORD
          ========================== */}

          {step === "forgot" && (
            <>
              <h1 className="mt-6 text-left text-4xl font-bold">
                {t.forgotTitle}
              </h1>

              <FieldDescription className="text-left">
                {t.forgotDescription}
              </FieldDescription>
            </>
          )}

          {/* =========================
              STATE 2: RESET PASSWORD
          ========================== */}

          {step === "reset" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-2 w-fit gap-2 px-0"
                onClick={handleStartOver}
              >
                <ArrowLeft className="size-4" />
                {t.back}
              </Button>

              <h1 className="text-left text-4xl font-bold">{t.resetTitle}</h1>

              <FieldDescription className="text-left">
                {t.resetDescription}
              </FieldDescription>
            </>
          )}

          {/* =========================
              STATE 3: SUCCESS
          ========================== */}

          {step === "success" && (
            <div className="mt-6 flex flex-col items-center text-center">
              <CheckCircle2 className="mb-4 size-14 text-green-500" />

              <h1 className="text-3xl font-bold">{t.successTitle}</h1>

              <FieldDescription className="mt-3">
                {t.successDescription}
              </FieldDescription>
            </div>
          )}

          {/* =========================
              STATE 4: FAILURE
          ========================== */}

          {step === "failure" && (
            <div className="mt-6 flex flex-col items-center text-center">
              <XCircle className="mb-4 size-14 text-destructive" />

              <h1 className="text-3xl font-bold">{t.failureTitle}</h1>

              <FieldDescription className="mt-3">
                {error || t.failureDescription}
              </FieldDescription>
            </div>
          )}
        </div>

        {/* =========================
            FORM: FORGOT PASSWORD
        ========================== */}

        {step === "forgot" && (
          <form onSubmit={handleForgotPassword} className="contents">
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

                {loading ? t.sending : t.sendCode}
              </Button>
            </Field>

            <FieldDescription className="text-center">
              {t.rememberPassword}{" "}
              <Link
                href="/auth/sign-in"
                className="font-medium text-primary hover:underline"
              >
                {t.signIn}
              </Link>
            </FieldDescription>
          </form>
        )}

        {/* =========================
            FORM: RESET PASSWORD
        ========================== */}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="contents">
            <Field>
              <FieldLabel htmlFor="code">{t.code}</FieldLabel>

              <Input
                id="code"
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
              <FieldLabel htmlFor="new-password">{t.newPassword}</FieldLabel>

              <div className="relative">
                <Input
                  id="new-password"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.newPasswordPlaceholder}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">
                {t.confirmPassword}
              </FieldLabel>

              <div className="relative">
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPasswordPlaceholder}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={
                    showConfirmPassword ? t.hidePassword : t.showPassword
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </Field>

            {error && (
              <FieldDescription className="text-destructive">
                {error}
              </FieldDescription>
            )}

            <Field>
              <Button
                type="submit"
                className="w-full"
                disabled={!code || !newPassword || !confirmPassword || loading}
              >
                {loading && <Loader2 className="size-4 animate-spin" />}

                {loading ? t.resetting : t.resetPassword}
              </Button>
            </Field>
          </form>
        )}

        {/* =========================
            SUCCESS ACTION
        ========================== */}

        {step === "success" && (
          <Field>
            <Button className="mt-4 w-full">
              <Link href="/auth/sign-in">{t.signIn}</Link>
            </Button>
          </Field>
        )}

        {/* =========================
            FAILURE ACTIONS
        ========================== */}

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
                {t.back}
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
