"use client";

import { useState } from "react";
import { Eye, EyeOff, Fingerprint } from "lucide-react";
import Link from "next/link";
import { startAuthentication } from "@simplewebauthn/browser";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  VerificationCodeDialog,
  type VerificationCodeType,
} from "@/components/dialogs/codes-dialog";
import {
  requestLoginOtp,
  verifyLoginOtp,
  loginWithPassword,
  verifyLoginTotp,
  loginWithGoogle,
  generatePasskeyLoginOptions,
  verifyPasskeyLogin,
  isRequiresTotp,
  userFromLoginData,
} from "@/lib/api/routes/auth";
import { getErrorMessage } from "@/lib/get-error-message";
import { detectDeviceName } from "@/lib/detect-device-name";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { useAuth } from "@/providers/auth-provider";
import type { AuthUser } from "@/types/auth";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { completeLogin, isCompletingLogin } = useAuth();

  const [usePassword, setUsePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeType, setCodeType] = useState<VerificationCodeType>("login");
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [pendingTotpToken, setPendingTotpToken] = useState<string | null>(null);

  async function finishLogin(sessionUser?: AuthUser | null) {
    await completeLogin(sessionUser);
  }

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setIsSubmittingForm(true);

    try {
      if (usePassword) {
        const result = await loginWithPassword({ email, password });

        if (isRequiresTotp(result)) {
          setPendingTotpToken(result.pendingToken);
          setCodeType("totp");
          setCodeDialogOpen(true);
        } else {
          await finishLogin(userFromLoginData(result));
          return;
        }
      } else {
        await requestLoginOtp({ email });
        setCodeType("login");
        setCodeDialogOpen(true);
      }
    } catch (err) {
      setFormError(
        getErrorMessage(err, "Une erreur s'est produite. Veuillez réessayer."),
      );
    } finally {
      setIsSubmittingForm(false);
    }
  }

  async function handleCodeSubmit(code: string) {
    setIsSubmittingCode(true);
    setCodeError(null);
    try {
      if (codeType === "login") {
        const result = await verifyLoginOtp({ email, code });
        setCodeDialogOpen(false);
        await finishLogin(userFromLoginData(result));
        return;
      } else {
        if (!pendingTotpToken) {
          throw new Error(
            "Contexte de session manquant — veuillez vous reconnecter.",
          );
        }
        const result = await verifyLoginTotp({ pendingToken: pendingTotpToken, code });
        setCodeDialogOpen(false);
        await finishLogin(userFromLoginData(result));
        return;
      }
    } catch (err) {
      setCodeError(getErrorMessage(err, "Une erreur s'est produite."));
    } finally {
      setIsSubmittingCode(false);
    }
  }

  async function handleResend() {
    setCodeError(null);
    if (codeType === "login") {
      try {
        await requestLoginOtp({ email });
      } catch (err) {
        setCodeError(getErrorMessage(err, "Impossible de renvoyer le code."));
      }
    }
  }

  async function handleGoogleCredential(idToken: string) {
    setFormError(null);
    setIsSubmittingForm(true);
    try {
      const result = await loginWithGoogle({
        idToken,
        deviceName: detectDeviceName(),
      });

      if (isRequiresTotp(result)) {
        setPendingTotpToken(result.pendingToken);
        setCodeType("totp");
        setCodeDialogOpen(true);
      } else {
        await finishLogin(userFromLoginData(result));
        return;
      }
    } catch (err) {
      setFormError(getErrorMessage(err, "Échec de la connexion Google."));
    } finally {
      setIsSubmittingForm(false);
    }
  }

  async function handlePasskeyLogin() {
    setFormError(null);
    setIsSubmittingForm(true);
    try {
      const { challengeId, ...options } = await generatePasskeyLoginOptions({
        email: email.trim() || undefined,
      });
      const response = await startAuthentication({
        optionsJSON: options as never,
      });
      const result = await verifyPasskeyLogin({
        email: email.trim() || undefined,
        challengeId,
        response,
        deviceName: detectDeviceName(),
      });

      if (isRequiresTotp(result)) {
        setPendingTotpToken(result.pendingToken);
        setCodeType("totp");
        setCodeDialogOpen(true);
      } else {
        await finishLogin(userFromLoginData(result));
        return;
      }
    } catch (err) {
      setFormError(
        getErrorMessage(
          err,
          "La connexion par clé d'accès a été annulée ou a échoué.",
        ),
      );
    } finally {
      setIsSubmittingForm(false);
    }
  }

  if (isCompletingLogin) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <form onSubmit={handleFormSubmit}>
        <FieldGroup className="gap-4">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-xl font-bold">Bienvenue sur SwiftGoma Admin</h1>
            <FieldDescription className="text-center">
              Gérez les vendeurs, les commandes et les paiements sur la
              marketplace SwiftGoma.
            </FieldDescription>
          </div>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <button
                type="button"
                onClick={() => setUsePassword((prev) => !prev)}
                className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 hover:underline"
              >
                {usePassword
                  ? "Connexion par code e-mail"
                  : "Connexion par mot de passe"}
              </button>
            </div>
            <Input
              id="email"
              type="email"
              placeholder="m@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmittingForm}
            />
            {!usePassword && (
              <FieldDescription>
                Facultatif pour la connexion par clé d'accès — laissez vide pour
                utiliser une clé enregistrée sur cet appareil.
              </FieldDescription>
            )}
          </Field>

          {usePassword && (
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                <Link
                  href="/auth/forgot-password"
                  className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmittingForm}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </Field>
          )}

          {formError && <p className="text-destructive text-sm">{formError}</p>}

          <Field>
            <Button
              type="submit"
              disabled={isSubmittingForm}
              className="w-full"
            >
              {isSubmittingForm ? "Veuillez patienter…" : "Se connecter"}
            </Button>
          </Field>

          <FieldSeparator>Ou</FieldSeparator>

          <Field className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              type="button"
              disabled={isSubmittingForm}
              onClick={handlePasskeyLogin}
              className="gap-2"
            >
              <Fingerprint className="size-4" />
              <span className="text-xs">Clé d'accès</span>
            </Button>
            <GoogleAuthButton
              onCredential={handleGoogleCredential}
              disabled={isSubmittingForm}
              className="gap-2"
            />
          </Field>
        </FieldGroup>
      </form>

      <VerificationCodeDialog
        open={codeDialogOpen}
        onOpenChange={setCodeDialogOpen}
        type={codeType}
        onSubmit={handleCodeSubmit}
        isSubmitting={isSubmittingCode}
        error={codeError}
        onResend={codeType === "totp" ? undefined : handleResend}
      />
    </div>
  );
}
