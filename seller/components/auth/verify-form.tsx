"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/otp-input";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiErrorMessage } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth-api";

interface VerifyFormProps extends React.ComponentProps<"div"> {
  userId: string;
  target: string;
}

export function VerifyForm({
  className,
  userId,
  target,
  ...props
}: VerifyFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleVerify = async (otp: string) => {
    setError(null);
    setLoading(true);

    try {
      await authApi.verifyAccount({ userId, code: otp });
      router.push("/auth/sign-in?verified=1");
    } catch (err) {
      setError(getApiErrorMessage(err));
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);

    try {
      await authApi.resendOtp({ userId, type: "ACCOUNT_VERIFICATION" });
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold">Vérifiez votre compte</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Un code à 6 chiffres a été envoyé à{" "}
          <span className="font-medium text-foreground">{target}</span>
        </p>
      </div>

      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={handleVerify}
        disabled={loading}
      />

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      <Button
        type="button"
        disabled={loading || code.length !== 6}
        onClick={() => handleVerify(code)}
      >
        {loading ? "Vérification..." : "Vérifier"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {resent ? (
          "Code renvoyé !"
        ) : (
          <>
            Vous n&apos;avez rien reçu ?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="underline underline-offset-4 hover:text-foreground disabled:opacity-50"
            >
              {resending ? "Envoi..." : "Renvoyer le code"}
            </button>
          </>
        )}
      </p>

      <Link
        href="/auth/sign-in"
        className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Retour à la connexion
      </Link>
    </div>
  );
}
