"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import Logo from "../global/logo";
import { OtpDialog, type OtpStatus } from "@/components/auth/modals/otp-dialog";
import { RotatingCaption, SIGNUP_STRINGS } from "@/lib/constants/auth";
import { DEFAULT_LOCALE, getClientLocale, Locale } from "@/lib/language";
import {
  createAccount,
  verifyEmail,
  resendEmailVerification,
} from "@/lib/api/routes/auth.routes";
import { isApiError } from "@/lib/api/client";
import { toast } from "../ui/toast";
import { registerWithGoogle } from "@/lib/api/routes/auth.routes";
import { useAuth } from "@/lib/auth/auth-context";
import { GoogleAuthButton } from "./google-auth-button";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = SIGNUP_STRINGS[locale];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [otpResendLoading, setOtpResendLoading] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState<string | undefined>();

  const { setUser } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  function extractErrorMessage(error: unknown, fallback: string): string {
    if (isApiError(error) && error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    return fallback;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      await createAccount({ name: name.trim(), email: email.trim(), locale });
      setOtpStatus("idle");
      setOtpErrorMessage(undefined);
      setOtpOpen(true);
    } catch (error) {
      toast.add({
        title: "Couldn't create account",
        description: extractErrorMessage(
          error,
          "Something went wrong creating your account. Please try again.",
        ),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(code: string) {
    setOtpLoading(true);
    try {
      await verifyEmail({ email: email.trim(), code });
      setOtpStatus("success");
    } catch (error) {
      setOtpErrorMessage(
        extractErrorMessage(error, "The code you entered is incorrect."),
      );
      setOtpStatus("error");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOtp() {
    setOtpResendLoading(true);
    try {
      await resendEmailVerification({ email: email.trim(), locale });
      toast.add({ title: "Verification code resent.", type: "success" });
    } catch (error) {
      toast.add({
        title: "Couldn't resend code",
        description: extractErrorMessage(
          error,
          "Couldn't resend the code. Please try again.",
        ),
        type: "error",
      });
    } finally {
      setOtpResendLoading(false);
    }
  }

  function handleVerifiedSuccess() {
    setOtpOpen(false);
    router.push("/auth/sign-in?verified=1");
  }

  async function handleGoogleCredential(idToken: string) {
    setIsGoogleLoading(true);
    try {
      const result = await registerWithGoogle({
        idToken,
        role: "BUYER",
        locale,
      });
      if ("user" in result) {
        setUser(result.user);
        router.push("/account");
      }
      router.push("/");
    } catch (err) {
      toast.add({
        title: "Couldn't sign up with Google",
        description: extractErrorMessage(
          err,
          "Something went wrong. Please try again.",
        ),
        type: "error",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          {/* Header */}
          <div className="flex flex-col gap-2 text-center">
            <div className="flex flex-col gap-2 font-medium">
              <div className="flex size-8 justify-start rounded-md">
                <Logo />
              </div>

              <span className="sr-only">SwiftGoma.</span>
            </div>

            <h1 className="mt-6 flex items-start justify-start text-4xl font-bold">
              {t.title}
            </h1>

            <FieldDescription>
              {t.alreadyHaveAccount}{" "}
              <Link
                href="/auth/sign-in"
                className="text-primary hover:underline"
              >
                {t.signIn}
              </Link>
            </FieldDescription>
          </div>

          {/* Name and email */}
          <Field>
            <FieldLabel htmlFor="name">{t.name}</FieldLabel>

            <Input
              id="name"
              name="name"
              type="text"
              placeholder={t.namePlaceholder}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
            />

            <FieldLabel htmlFor="email">{t.email}</FieldLabel>

            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t.emailPlaceholder}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </Field>

          {/* Submit */}
          <Field>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isGoogleLoading}
            >
              {isSubmitting ? "Creating account…" : t.createAccount}
            </Button>
          </Field>

          <FieldSeparator>{t.or}</FieldSeparator>

          <GoogleAuthButton
            onCredential={handleGoogleCredential}
            disabled={isGoogleLoading}
            label={isGoogleLoading ? "Creating account…" : t.continueWithGoogle}
            locale={locale}
          />
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center">
        <RotatingCaption locale={locale} />
      </FieldDescription>

      <OtpDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        mode="email-verification"
        locale={locale}
        email={email}
        loading={otpLoading}
        status={otpStatus}
        onStatusChange={setOtpStatus}
        errorMessage={otpErrorMessage}
        onSubmit={handleVerifyOtp}
        onResend={handleResendOtp}
        onSuccessAction={handleVerifiedSuccess}
        resendLoading={otpResendLoading}
      />
    </div>
  );
}
