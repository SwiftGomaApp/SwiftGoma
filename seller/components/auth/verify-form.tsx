"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/otp-input";
import { useRouter } from "next/navigation";
import Link from "next/link";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface VerifyFormProps extends React.ComponentProps<"div"> {
  identifier: string;
}

export function VerifyForm({
  className,
  identifier,
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

    // SIMULATION — replace with real API call: verify-account-otp { identifier, code }
    await wait(800);

    if (otp !== "123456") {
      console.log("[SIMULATION] Invalid verification code");
      setError("Code invalide. Veuillez réessayer.");
      setCode("");
      setLoading(false);
      return;
    }

    console.log("[SIMULATION] Account verified → redirect to onboarding");
    setLoading(false);
    // TODO: router.push("/onboarding/profile")
    router.push("/onboarding/profile");
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);

    // SIMULATION — replace with real API call: resend-otp { identifier }
    await wait(600);
    console.log("[SIMULATION] Verification code resent to", identifier);

    setResending(false);
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold">Vérifiez votre compte</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Un code à 6 chiffres a été envoyé à{" "}
          <span className="font-medium text-foreground">{identifier}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          (Simulation — utilisez le code 123456)
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
