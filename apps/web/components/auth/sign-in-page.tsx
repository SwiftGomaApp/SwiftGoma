"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { DEFAULT_LOCALE, getClientLocale, Locale } from "@/lib/language";

import { GoogleIcon, IllustrationPanel, STRINGS } from "@/lib/constants/auth";

import Link from "next/link";

import {
  OtpDialog,
  OtpMode,
  OtpStatus,
} from "@/components/auth/modals/otp-dialog";

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

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = STRINGS[locale];

  const openOtpDialog = (mode: OtpMode) => {
    setOtpMode(mode);
    setOtpStatus("idle");
    setOtpLoading(false);
    setOtpOpen(true);
  };

  const handleOtpOpenChange = (open: boolean) => {
    setOtpOpen(open);

    if (!open) {
      setOtpStatus("idle");
      setOtpLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) return;

    if (useEmailPassword) {
      openOtpDialog("totp");
      return;
    }

    openOtpDialog("otp-login");
  };

  const handleGoogleLogin = () => {
    openOtpDialog("2fa");
  };

  const handleOtpSubmit = (code: string) => {
    console.log("OTP submitted:", code);

    setOtpLoading(true);
    setOtpStatus("idle");

    setTimeout(() => {
      setOtpLoading(false);

      if (code === "123456") {
        setOtpStatus("success");
      } else {
        setOtpStatus("error");
      }
    }, 1000);
  };

  const handleBackupCode = (code: string) => {
    console.log("Backup code submitted:", code);

    setOtpLoading(true);
    setOtpStatus("idle");

    setTimeout(() => {
      setOtpLoading(false);

      if (code === "BACKUP01") {
        setOtpStatus("success");
      } else {
        setOtpStatus("error");
      }
    }, 1000);
  };

  const handleResend = () => {
    setOtpStatus("idle");

    console.log("Resending OTP...", {
      mode: otpMode,
      email,
    });
  };

  const handleOtpSuccess = () => {
    console.log("User clicked Continue");

    setOtpOpen(false);
    setOtpStatus("idle");

    // Later:
    // router.push("/dashboard");
  };

  return (
    <>
      <main className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-8">
        <Card className="w-full max-w-5xl overflow-hidden bg-background p-3 shadow-xl">
          <CardContent className="grid grid-cols-1 gap-0 p-0 md:grid-cols-2">
            <IllustrationPanel locale={locale} />

            <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
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

              <div className="mt-3 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2 font-medium"
                  onClick={handleGoogleLogin}
                >
                  <GoogleIcon />
                  {t.google}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2 font-medium"
                >
                  <KeyRound className="h-4 w-4" />
                  {t.passkey}
                </Button>
              </div>

              <div className="my-8">
                <Separator />
              </div>

              <p className="mb-5 text-center text-sm font-medium text-foreground">
                {t.orContinueWithEmail}
              </p>

              <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
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

                {!useEmailPassword && (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto w-fit p-0 text-sm font-medium"
                      onClick={() => setUseEmailPassword(true)}
                    >
                      {t.useEmailPassword}
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
                  disabled={!email || (useEmailPassword && !password)}
                >
                  {useEmailPassword ? t.signInButton : t.continueWithEmail}
                </Button>
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
        email={email}
        loading={otpLoading}
        status={otpStatus}
        onStatusChange={setOtpStatus}
        errorMessage="Wrong code. Please try again."
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
