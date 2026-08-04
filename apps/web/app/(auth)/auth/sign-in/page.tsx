"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { toast } from "@/lib/toast";
import { Mail, Lock, Eye, EyeOff, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/global/logo";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { authApi } from "@/lib/api/routes/auth";
import { ApiException } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { detectLocale } from "@/lib/locale";

function HexPattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 600 800"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="var(--primary-foreground)"
        strokeOpacity="0.08"
        strokeWidth="1.5"
      >
        <polygon points="60,20 100,45 100,95 60,120 20,95 20,45" />
        <polygon points="180,60 230,90 230,150 180,180 130,150 130,90" />
        <polygon points="480,40 520,65 520,115 480,140 440,115 440,65" />
        <polygon points="540,220 590,250 590,310 540,340 490,310 490,250" />
        <polygon points="40,320 80,345 80,395 40,420 0,395 0,345" />
        <polygon points="300,380 360,415 360,485 300,520 240,485 240,415" />
        <polygon points="500,500 540,525 540,575 500,600 460,575 460,525" />
        <polygon points="80,600 130,630 130,690 80,720 30,690 30,630" />
        <polygon points="380,650 420,675 420,725 380,750 340,725 340,675" />
      </g>
      <g
        stroke="var(--primary-foreground)"
        strokeOpacity="0.05"
        strokeWidth="1"
      >
        <circle cx="500" cy="150" r="60" />
        <circle cx="120" cy="480" r="80" />
      </g>
    </svg>
  );
}

type LoginMethod = "otp" | "password";

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof ApiException ? err.message : fallback;
}

function sanitizeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const [method, setMethod] = useState<LoginMethod>("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpCode, setOtpCode] = useState("");

  const [totpUserId, setTotpUserId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  function switchMethod(next: LoginMethod) {
    setMethod(next);
    setOtpStep("email");
    setOtpCode("");
    setTotpUserId(null);
    setTotpCode("");
  }

  async function completeLogin() {
    await refresh();
    router.push(sanitizeNextPath(searchParams.get("next")));
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.requestLoginOtp({ email, locale: detectLocale() });
      setOtpStep("code");
      toast.success("Code envoyé par email.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Une erreur est survenue."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.verifyLoginOtp({ email, code: otpCode });
      await completeLogin();
    } catch (err) {
      toast.error(getErrorMessage(err, "Code invalide."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await authApi.loginWithPassword({
        email,
        password,
        locale: detectLocale(),
      });
      if ("requiresTotp" in result) {
        setTotpUserId(result.userId);
      } else {
        await completeLogin();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Identifiants invalides."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTotpVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!totpUserId) return;
    setIsLoading(true);
    try {
      await authApi.loginWithTotp({ userId: totpUserId, code: totpCode });
      await completeLogin();
    } catch (err) {
      toast.error(getErrorMessage(err, "Code invalide."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleCredential(idToken: string) {
    setIsLoading(true);
    try {
      const result = await authApi.loginWithGoogle({
        idToken,
        locale: detectLocale(),
      });
      if ("requiresTotp" in result) {
        setTotpUserId(result.userId);
      } else {
        await completeLogin();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Connexion avec Google échouée."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasskeyLogin() {
    setIsLoading(true);
    try {
      const { challengeId, ...options } =
        await authApi.generatePasskeyLoginOptions({
          email: email || undefined,
        });
      const response = await startAuthentication({
        optionsJSON: options as never,
      });
      const result = await authApi.verifyPasskeyLogin({
        email: email || undefined,
        challengeId,
        response,
      });
      if ("requiresTotp" in result) {
        setTotpUserId(result.userId);
      } else {
        await completeLogin();
      }
    } catch (err) {
      if (err instanceof ApiException) {
        toast.error(err.message);
      } else {
        toast.error("Connexion par clé d'accès annulée ou échouée.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Logo />

          <div className="mt-10 flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Connectez-vous à votre compte.
            </h1>
            <p className="text-sm text-muted-foreground">
              {totpUserId
                ? "Entrez le code de votre application d'authentification."
                : "Entrez votre email pour recevoir un code, ou utilisez un mot de passe."}
            </p>
          </div>

          {totpUserId ? (
            <form
              onSubmit={handleTotpVerify}
              className="mt-8 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="totp-code"
                  className="text-sm font-medium text-foreground"
                >
                  Code de vérification
                </label>
                <Input
                  id="totp-code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  className="h-12"
                  autoFocus
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Vérification..." : "Vérifier"}
              </Button>
              <button
                type="button"
                onClick={() => switchMethod("password")}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Retour
              </button>
            </form>
          ) : (
            <>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => switchMethod("otp")}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    method === "otp"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary",
                  )}
                >
                  Code par email
                </button>
                <button
                  type="button"
                  onClick={() => switchMethod("password")}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    method === "password"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary",
                  )}
                >
                  Mot de passe
                </button>
              </div>

              {method === "otp" && (
                <form
                  onSubmit={
                    otpStep === "email" ? handleRequestOtp : handleVerifyOtp
                  }
                  className="mt-6 flex flex-col gap-4"
                >
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Adresse email"
                      className="h-12 pl-10"
                      disabled={otpStep === "code"}
                      required
                    />
                  </div>

                  {otpStep === "code" && (
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="otp-code"
                        className="text-sm font-medium text-foreground"
                      >
                        Code reçu par email
                      </label>
                      <Input
                        id="otp-code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        inputMode="numeric"
                        maxLength={6}
                        className="h-12"
                        autoFocus
                        required
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading
                      ? "Chargement..."
                      : otpStep === "email"
                        ? "Recevoir le code"
                        : "Se connecter"}
                  </Button>

                  {otpStep === "code" && (
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep("email");
                        setOtpCode("");
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Changer d&apos;email
                    </button>
                  )}
                </form>
              )}

              {method === "password" && (
                <form
                  onSubmit={handlePasswordLogin}
                  className="mt-6 flex flex-col gap-4"
                >
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Adresse email"
                      className="h-12 pl-10"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mot de passe"
                        className="h-12 px-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <Link
                      href="/auth/forgot-password"
                      className="self-end text-sm text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Connexion..." : "Connexion"}
                  </Button>
                </form>
              )}

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm text-muted-foreground">ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="flex flex-col gap-3">
                <GoogleAuthButton
                  onCredential={handleGoogleCredential}
                  disabled={isLoading}
                />

                <Button
                  variant="outline"
                  onClick={handlePasskeyLogin}
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  <Fingerprint className="h-4 w-4" />
                  Clé d&apos;accès (Passkey)
                </Button>
              </div>
            </>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Vous n&apos;avez pas de compte ?{" "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-primary hover:underline"
            >
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>

      {/* Right — brand panel with product previews */}
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <HexPattern />

        <div className="absolute right-8 top-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground shadow-lg">
          <Logo variant="icon" size={28} />
        </div>

        <div className="relative flex h-full flex-col items-center justify-center gap-8 px-12">
          <div className="relative w-full max-w-md">
            <div className="overflow-hidden rounded-2xl border-4 border-primary-foreground/20 shadow-2xl">
              <Image
                src="/marketing/products-preview.png"
                alt="Aperçu des produits Swiftgoma"
                width={800}
                height={600}
                className="w-full"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 w-56 overflow-hidden rounded-xl border-4 border-primary-foreground/20 shadow-2xl">
              <Image
                src="/marketing/categories-preview.png"
                alt="Aperçu des catégories Swiftgoma"
                width={400}
                height={300}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground">
              La marketplace la plus simple pour acheter et vendre.
            </h2>
            <p className="text-primary-foreground/80">
              Rejoignez la communauté Swiftgoma dès aujourd&apos;hui !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
