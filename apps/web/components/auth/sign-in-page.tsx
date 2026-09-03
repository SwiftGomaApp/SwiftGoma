"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_LOCALE, getClientLocale, Locale } from "@/lib/language";
import { IllustrationPanel, STRINGS } from "@/lib/constants/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getNextParam } from "@/lib/auth/sign-in-redirect";
import {
  requestLoginOtp,
  verifyLoginOtp,
  requestLoginOtpBySms,
  verifyLoginOtpBySms,
  loginWithPassword,
  loginWithTotp,
  loginWithGoogle,
  generatePasskeyLoginOptions,
  verifyPasskeyLogin,
} from "@/lib/api/routes/auth.routes";
import { isApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import {
  OtpDialog,
  OtpMode,
  OtpStatus,
} from "@/components/auth/modals/otp-dialog";
import { GoogleAuthButton } from "./google-auth-button";
import { AppleAuthButton } from "./apple-auth-button";
import { startAuthentication } from "@simplewebauthn/browser";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error) && error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  return fallback;
}

function getDeletionPendingEmail(error: unknown): string | null {
  if (!isApiError(error)) return null;
  const apiError = error.response?.data?.error;
  if (apiError?.code !== "ACCOUNT_DELETION_PENDING") return null;
  const details = apiError.details as { email?: string } | undefined;
  return details?.email ?? null;
}

export default function SignInPage() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [useEmailPassword, setUseEmailPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpMode, setOtpMode] = useState<OtpMode>("otp-login");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [usePhone, setUsePhone] = useState(false);
  const [phone, setPhone] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getNextParam(searchParams);
  const { setUser } = useAuth();
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = STRINGS[locale];

  const openOtpDialog = (mode: OtpMode) => {
    setOtpMode(mode);
    setOtpStatus("idle");
    setOtpErrorMessage(null);
    setOtpLoading(false);
    setOtpOpen(true);
  };

  const handleOtpOpenChange = (open: boolean) => {
    setOtpOpen(open);

    if (!open) {
      setOtpStatus("idle");
      setOtpErrorMessage(null);
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (usePhone ? !phone : !email) return;

    setIsSubmitting(true);
    try {
      if (usePhone) {
        await requestLoginOtpBySms(phone);
        openOtpDialog("otp-login");
      } else if (useEmailPassword) {
        if (!password) return;
        const result = await loginWithPassword({ email, password, locale });
        if ("requiresTotp" in result) {
          setPendingToken(result.pendingToken);
          openOtpDialog("totp");
        } else {
          setUser(result.user);
          router.push(nextPath);
        }
      } else {
        await requestLoginOtp({ email, locale });
        openOtpDialog("otp-login");
      }
    } catch (error) {
      const deletionEmail = getDeletionPendingEmail(error);
      if (deletionEmail) {
        router.push(
          `/auth/account-recovery?email=${encodeURIComponent(deletionEmail)}`,
        );
        return;
      }
      toast.add({
        title: "Couldn't sign in",
        description: extractErrorMessage(
          error,
          "Something went wrong. Please try again.",
        ),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle({ idToken });
      if ("requiresTotp" in result) {
        setPendingToken(result.pendingToken);
        openOtpDialog("2fa");
      } else {
        setUser(result.user);
        router.push(nextPath);
      }
    } catch (error) {
      const deletionEmail = getDeletionPendingEmail(error);
      if (deletionEmail) {
        router.push(
          `/auth/account-recovery?email=${encodeURIComponent(deletionEmail)}`,
        );
        return;
      }
      toast.add({
        title: "Couldn't sign in",
        description: extractErrorMessage(
          error,
          "Something went wrong. Please try again.",
        ),
        type: "error",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setIsPasskeyLoading(true);
    try {
      // If an email has been typed, scope the passkey prompt to that
      // account's registered credentials. Otherwise fall back to the
      // usernameless (discoverable-credential) flow.
      const trimmedEmail = email.trim();
      const options = await generatePasskeyLoginOptions(
        trimmedEmail ? { email: trimmedEmail } : {},
      );

      const response = await startAuthentication({ optionsJSON: options });

      const result = await verifyPasskeyLogin({
        email: trimmedEmail || undefined,
        challengeId: options.challengeId,
        response,
        locale,
      });

      if ("requiresTotp" in result) {
        setPendingToken(result.pendingToken);
        openOtpDialog("2fa");
      } else {
        setUser(result.user);
        router.push(nextPath);
      }
    } catch (error) {
      const deletionEmail = getDeletionPendingEmail(error);
      if (deletionEmail) {
        router.push(
          `/auth/account-recovery?email=${encodeURIComponent(deletionEmail)}`,
        );
        return;
      }
      // The user cancelling or dismissing the browser's passkey prompt
      // throws too — don't show a scary error toast for that case.
      const isCancelled =
        error instanceof Error && error.name === "NotAllowedError";
      if (!isCancelled) {
        toast.add({
          title: "Couldn't sign in with passkey",
          description: extractErrorMessage(
            error,
            "Something went wrong. Please try again.",
          ),
          type: "error",
        });
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleOtpSubmit = async (code: string) => {
    setOtpLoading(true);
    setOtpStatus("idle");

    try {
      if (otpMode === "totp" || otpMode === "2fa") {
        if (!pendingToken) throw new Error("Missing login session.");
        const result = await loginWithTotp({ pendingToken, code });
        if (!("user" in result)) throw new Error("Unexpected TOTP response.");
        setUser(result.user);
      } else if (usePhone) {
        const result = await verifyLoginOtpBySms({ phone, code });
        if (!("user" in result)) throw new Error("Unexpected OTP response.");
        setUser(result.user);
      } else {
        const result = await verifyLoginOtp({ email, code });
        if (!("user" in result)) throw new Error("Unexpected OTP response.");
        setUser(result.user);
      }
      setOtpStatus("success");
    } catch (error) {
      const deletionEmail = getDeletionPendingEmail(error);
      if (deletionEmail) {
        setOtpOpen(false);
        router.push(
          `/auth/account-recovery?email=${encodeURIComponent(deletionEmail)}`,
        );
        return;
      }
      console.error(error);
      setOtpErrorMessage(
        extractErrorMessage(error, "Wrong code. Please try again."),
      );
      setOtpStatus("error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleBackupCode = async (code: string) => {
    setOtpLoading(true);
    setOtpStatus("idle");

    try {
      if (!pendingToken) throw new Error("Missing login session.");
      const result = await loginWithTotp({ pendingToken, code });
      if (!("user" in result)) throw new Error("Unexpected TOTP response.");
      setUser(result.user);
      setOtpStatus("success");
    } catch (error) {
      const deletionEmail = getDeletionPendingEmail(error);
      if (deletionEmail) {
        setOtpOpen(false);
        router.push(
          `/auth/account-recovery?email=${encodeURIComponent(deletionEmail)}`,
        );
        return;
      }
      console.error(error);
      setOtpErrorMessage(
        extractErrorMessage(error, "Wrong code. Please try again."),
      );
      setOtpStatus("error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (otpMode !== "otp-login") return;

    try {
      if (usePhone) {
        await requestLoginOtpBySms(phone);
      } else {
        await requestLoginOtp({ email, locale });
      }
    } catch (error) {
      console.error("Failed to resend login code", error);
      toast.add({
        title: "Couldn't resend code",
        description: extractErrorMessage(
          error,
          "Something went wrong. Please try again.",
        ),
        type: "error",
      });
    }
  };

  const handleOtpSuccess = () => {
    setOtpOpen(false);
    setOtpStatus("idle");
    router.push(nextPath);
  };

  return (
    <>
      <main className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-8">
        <Card className="w-full max-w-5xl overflow-hidden bg-background p-3 shadow-xl">
          <CardContent className="grid grid-cols-1 gap-0 p-0 md:grid-cols-2">
            <IllustrationPanel locale={locale} />

            <div className="@container flex flex-col justify-center px-6 py-10 sm:px-12">
              {/* Sign up */}
              <div className="mb-10 flex items-center justify-end text-sm">
                <span className="text-muted-foreground">{t.noAccount}</span>

                <Link
                  href="/auth/sign-up"
                  className="pl-1 font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {t.signUp}
                </Link>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {t.signIn}
              </h1>

              <p className="mt-8 text-sm font-medium text-foreground">
                {t.continueWith}
              </p>

              <div className="mt-3 flex flex-col gap-3 @sm:flex-row">
                <div className="min-w-0 @sm:flex-1">
                  <GoogleAuthButton
                    onCredential={handleGoogleCredential}
                    disabled={isGoogleLoading}
                    label={
                      <>
                        <span className="@sm:hidden">
                          {t.continueWithGoogle}
                        </span>
                        <span className="hidden @sm:inline">{t.google}</span>
                      </>
                    }
                    locale={locale}
                  />
                </div>

                <div className="min-w-0 @sm:flex-1">
                  <AppleAuthButton
                    label={
                      <>
                        <span className="@sm:hidden">
                          {t.continueWithApple}
                        </span>
                        <span className="hidden @sm:inline">{t.apple}</span>
                      </>
                    }
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="min-w-0 gap-2 font-medium @sm:flex-1"
                  onClick={handlePasskeyLogin}
                  disabled={isPasskeyLoading}
                >
                  <KeyRound className="h-4 w-4 shrink-0" />
                  <span className="truncate @sm:hidden">
                    {t.continueWithPasskey}
                  </span>
                  <span className="hidden truncate @sm:inline">
                    {t.passkey}
                  </span>
                </Button>
              </div>

              <div className="my-8">
                <Separator />
              </div>

              <p className="mb-5 text-center text-sm font-medium text-foreground">
                {usePhone ? t.orContinueWithPhone : t.orContinueWithEmail}
              </p>

              <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                {usePhone ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">{t.phoneLabel}</Label>

                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t.phonePlaceholder}
                      autoComplete="tel"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="email">{t.emailLabel}</Label>

                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      autoComplete="email"
                    />
                  </div>
                )}

                {!useEmailPassword && !usePhone && (
                  <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto w-fit p-0 text-sm font-medium"
                      onClick={() => setUseEmailPassword(true)}
                    >
                      {t.useEmailPassword}
                    </Button>
                    <span className="text-muted-foreground">·</span>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto w-fit p-0 text-sm font-medium"
                      onClick={() => setUsePhone(true)}
                    >
                      {t.usePhoneNumber}
                    </Button>
                  </div>
                )}

                {usePhone && (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto w-fit p-0 text-sm font-medium"
                      onClick={() => setUsePhone(false)}
                    >
                      {t.useEmailInstead}
                    </Button>
                  </div>
                )}

                {useEmailPassword && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="flex justify-between">
                      {t.passwordLabel}

                      <Link
                        href="/auth/forgot-password"
                        className="text-primary hover:underline"
                      >
                        {t.forgotPassword}
                      </Link>
                    </Label>

                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.passwordPlaceholder}
                        className="pr-10"
                        autoComplete="current-password"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label={
                          showPassword ? t.hidePassword : t.showPassword
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="mt-2 w-full font-semibold"
                  disabled={
                    (usePhone ? !phone : !email) ||
                    (useEmailPassword && !password) ||
                    isSubmitting
                  }
                >
                  {isSubmitting
                    ? "Loading..."
                    : usePhone
                      ? t.continueWithPhone
                      : useEmailPassword
                        ? t.signInButton
                        : t.continueWithEmail}
                </Button>

                <div className="mt-2 flex justify-center">
                  <Link
                    href="/auth/locked-out"
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    {locale === "fr"
                      ? "Verrouillé hors de votre compte ?"
                      : "Locked out of your account?"}
                  </Link>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </main>

      <OtpDialog
        open={otpOpen}
        onOpenChange={handleOtpOpenChange}
        mode={otpMode}
        locale={locale}
        email={usePhone ? phone : email}
        description={
          usePhone && otpMode === "otp-login" ? t.otpSentToPhone : undefined
        }
        loading={otpLoading}
        status={otpStatus}
        onStatusChange={setOtpStatus}
        errorMessage={otpErrorMessage ?? undefined}
        onSubmit={handleOtpSubmit}
        onUseBackupCode={handleBackupCode}
        onResend={handleResend}
        successTitle="Login successful!"
        successDescription="Your identity has been verified successfully."
        successButtonLabel="Continue"
        onSuccessAction={handleOtpSuccess}
      />
    </>
  );
}
