"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/global/logo";
import { authApi } from "@/lib/api/routes/auth";
import { ApiException } from "@/lib/api";
import { detectLocale } from "@/lib/locale";

const RESEND_COOLDOWN_SECONDS = 30;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(
      () => setCooldown((c) => Math.max(0, c - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsVerifying(true);
    try {
      await authApi.verifyEmail({ email, code });
      toast.success("Email vérifié. Vous pouvez maintenant vous connecter.");
      router.push("/auth/sign-in?verified=true");
    } catch (err) {
      toast.error(err instanceof ApiException ? err.message : "Code invalide.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    try {
      await authApi.resendEmailVerification({
        email,
        locale: detectLocale(),
      });
      toast.success("Code renvoyé.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center gap-6">
        <Logo />

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Vérifiez votre email
          </h1>
          <p className="text-sm text-muted-foreground">
            Un code a été envoyé à{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className="text-sm font-medium text-foreground">
            Code de vérification
          </label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            className="h-12 text-center text-lg tracking-[0.5em]"
            autoFocus
            required
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isVerifying}
          className="w-full"
        >
          {isVerifying ? "Vérification..." : "Vérifier"}
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || cooldown > 0}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {cooldown > 0
            ? `Renvoyer le code (${cooldown}s)`
            : isResending
              ? "Envoi..."
              : "Renvoyer le code"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Mauvaise adresse ?{" "}
        <Link
          href="/auth/sign-up"
          className="font-medium text-primary hover:underline"
        >
          Recommencer
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}
