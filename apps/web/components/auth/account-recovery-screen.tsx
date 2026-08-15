"use client";

import { useState } from "react";
import { RotateCcw, Mail, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/global/logo";
import { authApi, type RequiresTotpResult } from "@/lib/api/routes/auth";
import { ApiException } from "@/lib/api";

type Props = {
  email: string;
  recoverableUntil: string;
  onCancel: () => void;
  onRecovered: () => Promise<void>;
  onRequiresTotp: (result: RequiresTotpResult) => void;
};

function formatDeadline(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function AccountRecoveryScreen({
  email,
  recoverableUntil,
  onCancel,
  onRecovered,
  onRequiresTotp,
}: Props) {
  const [step, setStep] = useState<"intro" | "code">("intro");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  function startCooldown() {
    setCooldown(30);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function handleRequestCode() {
    if (!email) {
      toast.error(
        "Impossible de déterminer votre email. Contactez le support.",
      );
      return;
    }
    setIsLoading(true);
    try {
      await authApi.requestAccountRecovery({ email });
      toast.success("Si votre compte est récupérable, un code a été envoyé.");
      setStep("code");
      startCooldown();
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await authApi.verifyAccountRecovery({ email, code });
      if ("requiresTotp" in result) {
        onRequiresTotp(result);
      } else {
        await onRecovered();
      }
    } catch (err) {
      toast.error(err instanceof ApiException ? err.message : "Code invalide.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <RotateCcw className="h-6 w-6 text-destructive" />
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
          Ce compte a été supprimé
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous pouvez encore le récupérer jusqu&apos;au{" "}
          <span className="font-medium text-foreground">
            {formatDeadline(recoverableUntil)}
          </span>
          . Passé ce délai, il ne sera plus possible de le restaurer.
        </p>

        {step === "intro" ? (
          <div className="mt-8 flex flex-col gap-3">
            <Button
              type="button"
              size="lg"
              disabled={isLoading}
              onClick={handleRequestCode}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Recevoir un code de récupération
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleVerifyCode}
            className="mt-8 flex flex-col gap-4 text-left"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="recovery-code"
                className="text-sm font-medium text-foreground"
              >
                Code reçu par email
              </label>
              <Input
                id="recovery-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                className="h-12 text-center tracking-widest"
                autoFocus
                required
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !code.trim()}
              className="w-full"
            >
              {isLoading ? "Vérification..." : "Récupérer mon compte"}
            </Button>
            <button
              type="button"
              disabled={cooldown > 0 || isLoading}
              onClick={handleRequestCode}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50 disabled:hover:no-underline"
            >
              {cooldown > 0
                ? `Renvoyer le code (${cooldown}s)`
                : "Renvoyer le code"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
