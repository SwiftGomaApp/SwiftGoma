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
  isRequiresTotp,
} from "@/lib/api/routes/auth";
import { ApiError } from "@/lib/api/client";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

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
  // Only populated when the backend actually returns requiresTotp —
  // loginWithTotp needs this, not the email.
  const [pendingTotpUserId, setPendingTotpUserId] = useState<string | null>(
    null,
  );

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmittingForm(true);

    try {
      if (usePassword) {
        const result = await loginWithPassword({ email, password });

        if (isRequiresTotp(result)) {
          // Server says this account has 2FA enabled — only now do we
          // show the TOTP dialog, never unconditionally.
          setPendingTotpUserId(result.userId);
          setCodeType("totp");
          setCodeDialogOpen(true);
        } else {
          // No 2FA on this account — password alone was enough,
          // session already issued, go straight in.
          router.push("/user");
        }
      } else {
        await requestLoginOtp({ email });
        setCodeType("login");
        setCodeDialogOpen(true);
      }
    } catch (err) {
      setFormError(
        getErrorMessage(err, "Something went wrong. Please try again."),
      );
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleCodeSubmit = async (code: string) => {
    setIsSubmittingCode(true);
    setCodeError(null);
    try {
      if (codeType === "login") {
        await verifyLoginOtp({ email, code });
        setCodeDialogOpen(false);
        router.push("/user");
      } else {
        if (!pendingTotpUserId) {
          throw new Error("Missing session context — please log in again.");
        }
        await verifyLoginTotp({ userId: pendingTotpUserId, code });
        setCodeDialogOpen(false);
        router.push("/user");
      }
    } catch (err) {
      setCodeError(getErrorMessage(err, "Something went wrong."));
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handleResend = async () => {
    setCodeError(null);
    if (codeType === "login") {
      try {
        await requestLoginOtp({ email });
      } catch (err) {
        setCodeError(getErrorMessage(err, "Couldn't resend the code."));
      }
    }
    // No resend concept for TOTP — VerificationCodeDialog already omits
    // the resend button in that case via onResend={undefined} below.
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <form onSubmit={handleFormSubmit}>
        <FieldGroup className="gap-4">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-xl font-bold">Welcome to SwiftGoma Admin</h1>
            <FieldDescription className="text-center">
              Manage sellers, orders, and payouts across the SwiftGoma
              marketplace.
            </FieldDescription>
          </div>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <button
                type="button"
                onClick={() => setUsePassword((prev) => !prev)}
                className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 hover:underline"
              >
                {usePassword ? "Login with Email" : "Login with password"}
              </button>
            </div>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmittingForm}
            />
          </Field>

          {usePassword && (
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link
                  href="/auth/forgot-password"
                  className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 hover:underline"
                >
                  Forgot password?
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
            <Button type="submit" disabled={isSubmittingForm}>
              {isSubmittingForm ? "Please wait..." : "Login"}
            </Button>
          </Field>
          <FieldSeparator>Or</FieldSeparator>
          <Field className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" type="button">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 21a8 8 0 0 1 13.292-6" />
                <circle cx="10" cy="8" r="5" />
                <path d="M18 8a3 3 0 0 1 6 0v4a1 1 0 0 1-1 1h-2l-2 2v1.5a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5V15h-1.5a.5.5 0 0 1-.5-.5V13a3 3 0 0 1 3-5Z" />
                <circle cx="21" cy="11" r="1" fill="currentColor" />
              </svg>
              <p className="text-xs"> Continue with Passkey</p>
            </Button>
            <Button variant="outline" type="button">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <p className="text-xs">Continue with Google</p>
            </Button>
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
