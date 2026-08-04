"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userApi } from "@/lib/api/routes/user";
import { ApiException } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { detectLocale } from "@/lib/locale";

type Step = "idle" | "code";

export function SecurityPhone() {
  const { user, refresh } = useAuth();
  const [step, setStep] = useState<Step>("idle");
  const [phoneInput, setPhoneInput] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const hasPhone = Boolean(user?.phone);
  const isVerified = user?.isPhoneVerified ?? false;
  const isUpdating = hasPhone; // requesting a new number when one already exists

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isUpdating) {
        await userApi.requestPhoneUpdate({ newPhone: phoneInput });
      } else {
        await userApi.requestPhoneVerification({ phone: phoneInput });
      }
      toast.success("Code envoyé par SMS.");
      setStep("code");
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
      if (isUpdating) {
        await userApi.verifyPhoneUpdate({ code, locale: detectLocale() });
      } else {
        await userApi.verifyPhone({ code, locale: detectLocale() });
      }
      toast.success("Numéro de téléphone vérifié.");
      await refresh();
      setStep("idle");
      setPhoneInput("");
      setCode("");
    } catch (err) {
      toast.error(err instanceof ApiException ? err.message : "Code invalide.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Phone className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Numéro de téléphone
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasPhone ? (
              <span className="flex items-center gap-1">
                {user?.phone}
                {isVerified && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </span>
            ) : (
              "Ajoutez un numéro pour sécuriser votre compte."
            )}
          </p>
        </div>
      </div>

      {step === "idle" && (
        <form onSubmit={handleRequestCode} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone-input">
              {isUpdating ? "Nouveau numéro" : "Numéro de téléphone"}
            </Label>
            <Input
              id="phone-input"
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+243 8XX XXX XXX"
              required
            />
          </div>
          <Button type="submit" disabled={isLoading} className="self-start">
            {isLoading
              ? "Envoi..."
              : isUpdating
                ? "Changer le numéro"
                : "Vérifier ce numéro"}
          </Button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone-code">Code reçu par SMS</Label>
            <Input
              id="phone-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
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
              {isLoading ? "Vérification..." : "Confirmer"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
