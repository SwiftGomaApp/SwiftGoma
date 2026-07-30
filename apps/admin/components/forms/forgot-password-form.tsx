"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  forgotPassword,
  resetPassword,
  type Locale,
} from "@/lib/api/routes/auth";
import { ApiError } from "@/lib/api/client";

function getDeviceLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.toLowerCase() ?? "";
  return lang.startsWith("fr") ? "fr" : "en";
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

const RESEND_COOLDOWN_SECONDS = 60;

type Step = "request" | "reset" | "done";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  const handleRequestCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword({ email, locale: getDeviceLocale() });
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setStep("reset");
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    setError(null);
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    try {
      await forgotPassword({ email, locale: getDeviceLocale() });
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't resend the code."));
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        email,
        code,
        newPassword,
        locale: getDeviceLocale(),
      });
      setStep("done");
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "done") {
    return (
      <div
        className={cn("flex flex-col gap-4 text-center", className)}
        {...props}
      >
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-xl font-bold">Password changed</h1>
          <FieldDescription className="text-center">
            Your password has been reset. You&apos;ve been signed out of all
            devices — log in again with your new password.
          </FieldDescription>
        </div>
        <Button className="mt-2" onClick={() => router.push("/auth/login")}>
          Back to login
        </Button>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <div className={cn("flex flex-col gap-4", className)} {...props}>
        <form onSubmit={handleResetPassword}>
          <FieldGroup className="gap-4">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h1 className="text-xl font-bold">Reset your password</h1>
              <FieldDescription className="text-center">
                Enter the code we sent to{" "}
                <span className="font-medium">{email}</span> and choose a new
                password.
              </FieldDescription>
            </div>

            <Field>
              <FieldLabel htmlFor="reset-code">Reset code</FieldLabel>
              <InputOTP
                id="reset-code"
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={isSubmitting}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-12 w-10" />
                  <InputOTPSlot index={1} className="h-12 w-10" />
                  <InputOTPSlot index={2} className="h-12 w-10" />
                  <InputOTPSlot index={3} className="h-12 w-10" />
                  <InputOTPSlot index={4} className="h-12 w-10" />
                  <InputOTPSlot index={5} className="h-12 w-10" />
                </InputOTPGroup>
              </InputOTP>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isSubmitting || secondsLeft > 0}
                  className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                >
                  {secondsLeft > 0
                    ? `Resend code in ${secondsLeft}s`
                    : "Resend code"}
                </button>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <FieldDescription>At least 8 characters.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm new password
              </FieldLabel>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </Field>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Resetting..." : "Reset password"}
              </Button>
            </Field>

            <FieldDescription className="text-center">
              <Link href="/auth/login" className="underline underline-offset-4">
                Back to login
              </Link>
            </FieldDescription>
          </FieldGroup>
        </form>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <form onSubmit={handleRequestCode}>
        <FieldGroup className="gap-4">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-xl font-bold">Forgot password?</h1>
            <FieldDescription className="text-center">
              Enter your email and we&apos;ll send you a code to reset your
              password.
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </Field>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset code"}
            </Button>
          </Field>

          <FieldDescription className="text-center">
            Remembered your password?{" "}
            <Link href="/auth/login" className="underline underline-offset-4">
              Back to login
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}
