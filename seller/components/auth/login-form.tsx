"use client";

import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OtpInput } from "@/components/auth/otp-input";
import { KeyRound, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/api-client";
import { authApi, passkeyApi, totpApi } from "@/lib/api/auth-api";
import { useAuth } from "@/src/providers/auth-context";

type LoginMethod = "otp" | "password";
type Step = "identifier" | "otp-code" | "totp-code";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [method, setMethod] = useState<LoginMethod>("otp");
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [otpUserId, setOtpUserId] = useState<string | null>(null);
  const [otpTarget, setOtpTarget] = useState<string | null>(null);

  const { refetch } = useAuth();

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (method === "otp") {
        const res = await authApi.loginWithOtp({ identifier });
        setOtpUserId(res.data.userId);
        setOtpTarget(res.data.target);
        setStep("otp-code");
      } else {
        const res = await authApi.loginWithPassword({ identifier, password });

        if ("requires2fa" in res.data && res.data.requires2fa) {
          setPendingUserId(res.data.userId);
          setStep("totp-code");
        } else {
          await refetch();
          router.push("/");
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (!otpUserId) return;
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.verifyLoginOtp({ userId: otpUserId, code });

      if ("requires2fa" in res.data && res.data.requires2fa) {
        setPendingUserId(res.data.userId);
        setStep("totp-code");
      } else {
        await refetch();
        router.push("/");
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async (code: string) => {
    if (!pendingUserId) return;
    setError(null);
    setLoading(true);

    try {
      await totpApi.verifyLogin({ userId: pendingUserId, code });
      await refetch();
      router.push("/");
    } catch (err) {
      setError(getApiErrorMessage(err));
      setTotpCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpUserId) return;
    setError(null);

    try {
      const res = await authApi.resendOtp({
        userId: otpUserId,
        type: "SIGNIN",
      });
      setOtpTarget(res.data.target);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handlePasskeyLogin = async () => {
    setError(null);
    setPasskeyLoading(true);

    try {
      const { data: options } = await passkeyApi.getAuthOptions();

      const { startAuthentication } = await import("@simplewebauthn/browser");
      const credential = await startAuthentication(options as any);

      await passkeyApi.verifyAuth({ credential });
      router.push("/");
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setPasskeyLoading(false);
        return;
      }
      setError(getApiErrorMessage(err));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const goBack = () => {
    setError(null);
    setOtpCode("");
    setTotpCode("");
    setStep("identifier");
  };

  if (step === "identifier") {
    return (
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={handleIdentifierSubmit}
        {...props}
      >
        <FieldGroup>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold">Connexion</h1>
            <p className="text-sm text-balance text-muted-foreground">
              Entrez vos identifiants pour accéder à votre boutique
            </p>
          </div>

          <Tabs
            value={method}
            onValueChange={(v) => {
              setMethod(v as LoginMethod);
              setError(null);
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="otp" className="flex-1">
                Code OTP
              </TabsTrigger>
              <TabsTrigger value="password" className="flex-1">
                Mot de passe
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Field className="gap-3">
            <Field>
              <FieldLabel htmlFor="identifier">E-mail ou téléphone</FieldLabel>
              <Input
                id="identifier"
                type="text"
                placeholder="vous@exemple.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </Field>

            {method === "password" && (
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading
                ? "Veuillez patienter..."
                : method === "otp"
                  ? "Recevoir le code"
                  : "Se connecter"}
            </Button>
          </Field>

          <FieldSeparator>Ou continuer avec</FieldSeparator>

          <Field className="gap-3">
            <Button variant="outline" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Se connecter avec Google
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading}
            >
              <KeyRound className="size-4" />
              {passkeyLoading
                ? "Vérification..."
                : "Se connecter avec une clé d'accès"}
            </Button>
          </Field>

          <FieldDescription className="text-center">
            Pas encore de compte ?{" "}
            <Link href="/auth/sign-up" className="underline underline-offset-4">
              Créer une boutique
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    );
  }

  if (step === "otp-code") {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour
        </button>

        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-xl font-semibold">Entrez le code</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Un code à 6 chiffres a été envoyé à{" "}
            <span className="font-medium text-foreground">{otpTarget}</span>
          </p>
        </div>

        <OtpInput
          value={otpCode}
          onChange={setOtpCode}
          onComplete={handleVerifyOtp}
          disabled={loading}
        />

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}

        <Button
          type="button"
          disabled={loading || otpCode.length !== 6}
          onClick={() => handleVerifyOtp(otpCode)}
        >
          {loading ? "Vérification..." : "Vérifier"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Vous n&apos;avez rien reçu ?{" "}
          <button
            type="button"
            onClick={handleResendOtp}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Renvoyer le code
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <button
        type="button"
        onClick={goBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour
      </button>

      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold">
          Authentification à deux facteurs
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          Entrez le code à 6 chiffres généré par votre application
          d&apos;authentification, ou un code de secours
        </p>
      </div>

      <OtpInput
        value={totpCode}
        onChange={setTotpCode}
        onComplete={handleVerifyTotp}
        disabled={loading}
      />

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      <Button
        type="button"
        disabled={loading || totpCode.length !== 6}
        onClick={() => handleVerifyTotp(totpCode)}
      >
        {loading ? "Vérification..." : "Vérifier"}
      </Button>
    </div>
  );
}
