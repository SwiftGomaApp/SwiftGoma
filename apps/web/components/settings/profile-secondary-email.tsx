"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { Mail, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userApi } from "@/lib/api/routes/user";
import { ApiException } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { detectLocale } from "@/lib/locale";

type Step = "idle" | "adding" | "code";

export function ProfileSecondaryEmail() {
  const { user, refresh } = useAuth();
  const [step, setStep] = useState<Step>("idle");
  const [emailInput, setEmailInput] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const secondaryEmails = (user?.emails ?? []).filter((e) => !e.isPrimary);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await userApi.requestSecondaryEmail({
        email: emailInput,
        locale: detectLocale(),
      });
      toast.success("Code envoyé par email.");
      setStep("code");
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await userApi.verifySecondaryEmail({ code, locale: detectLocale() });
      toast.success("Email secondaire ajouté.");
      await refresh();
      setStep("idle");
      setEmailInput("");
      setCode("");
    } catch (err) {
      toast.error(err instanceof ApiException ? err.message : "Code invalide.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemove() {
    setIsRemoving(true);
    try {
      await userApi.removeSecondaryEmail();
      toast.success("Email secondaire retiré.");
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Email secondaire
        </h3>
        <p className="text-sm text-muted-foreground">
          Ajoutez une adresse email de secours pour votre compte.
        </p>
      </div>

      {secondaryEmails.length > 0 && (
        <ul className="flex flex-col divide-y divide-border">
          {secondaryEmails.map((email) => (
            <li key={email.id} className="flex items-center gap-3 py-3">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm text-foreground">
                {email.email}
              </span>
              {email.isVerified && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <button
                type="button"
                onClick={handleRemove}
                disabled={isRemoving}
                aria-label="Retirer"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {step === "idle" && secondaryEmails.length === 0 && (
        <Button
          variant="outline"
          onClick={() => setStep("adding")}
          className="self-start"
        >
          Ajouter un email secondaire
        </Button>
      )}

      {step === "adding" && (
        <form onSubmit={handleRequest} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="secondary-email">Adresse email</Label>
            <Input
              id="secondary-email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("idle")}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Envoi..." : "Envoyer le code"}
            </Button>
          </div>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="secondary-code">Code de vérification</Label>
            <Input
              id="secondary-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              autoFocus
              required
            />
          </div>
          <Button type="submit" disabled={isLoading} className="self-start">
            {isLoading ? "Vérification..." : "Confirmer"}
          </Button>
        </form>
      )}
    </div>
  );
}
