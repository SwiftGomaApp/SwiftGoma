"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "@/lib/toast";
import { ShieldCheck, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/routes/auth";
import { ApiException } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

type SetupStep = "idle" | "scan" | "backup-codes";

export function SecurityTwoFactor() {
  const { user, refresh } = useAuth();
  const [step, setStep] = useState<SetupStep>("idle");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disableCode, setDisableCode] = useState("");
  const [regenerateCode, setRegenerateCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);

  const isEnabled = user?.twoFactorEnabled ?? false;

  async function handleStartSetup() {
    setIsLoading(true);
    try {
      const result = await authApi.setupTotp();
      setQrCodeDataUrl(result.qrCodeDataUrl);
      setManualEntryKey(result.manualEntryKey);
      setStep("scan");
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await authApi.confirmTotp({ code: confirmCode });
      setBackupCodes(result.backupCodes);
      setStep("backup-codes");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiException ? err.message : "Code invalide.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegenerate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await authApi.regenerateBackupCodes({
        code: regenerateCode,
      });
      setBackupCodes(result.backupCodes);
      setStep("backup-codes");
      setShowRegenerateForm(false);
      setRegenerateCode("");
    } catch (err) {
      toast.error(err instanceof ApiException ? err.message : "Code invalide.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.disableTotp({ code: disableCode });
      toast.success("Authentification à deux facteurs désactivée.");
      await refresh();
      setShowDisableForm(false);
      setDisableCode("");
    } catch (err) {
      toast.error(err instanceof ApiException ? err.message : "Code invalide.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDone() {
    setStep("idle");
    setConfirmCode("");
    setBackupCodes([]);
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Codes copiés.");
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Authentification à deux facteurs
          </h3>
          <p className="text-sm text-muted-foreground">
            {isEnabled
              ? "Activée"
              : "Ajoutez une couche de sécurité supplémentaire."}
          </p>
        </div>
      </div>

      {step === "idle" && (
        <>
          {isEnabled ? (
            showDisableForm ? (
              <form onSubmit={handleDisable} className="flex flex-col gap-3">
                <Input
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="Code de votre application ou code de secours"
                  autoFocus
                  required
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDisableForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={isLoading}
                  >
                    {isLoading ? "Désactivation..." : "Désactiver"}
                  </Button>
                </div>
              </form>
            ) : showRegenerateForm ? (
              <form onSubmit={handleRegenerate} className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Vos anciens codes de secours seront invalidés et remplacés par
                  un nouveau jeu.
                </p>
                <Input
                  value={regenerateCode}
                  onChange={(e) => setRegenerateCode(e.target.value)}
                  placeholder="Code de votre application ou code de secours"
                  autoFocus
                  required
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRegenerateForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Génération..." : "Régénérer"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRegenerateForm(true)}
                >
                  Régénérer les codes de secours
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDisableForm(true)}
                >
                  Désactiver
                </Button>
              </div>
            )
          ) : (
            <Button
              onClick={handleStartSetup}
              disabled={isLoading}
              className="self-start"
            >
              {isLoading ? "Chargement..." : "Activer"}
            </Button>
          )}
        </>
      )}

      {step === "scan" && (
        <form onSubmit={handleConfirm} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Scannez ce code avec votre application d&apos;authentification
            (Google Authenticator, Authy, etc.).
          </p>
          {qrCodeDataUrl && (
            <div className="flex justify-center">
              <Image
                src={qrCodeDataUrl}
                alt="QR code 2FA"
                width={180}
                height={180}
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              Ou entrez cette clé manuellement :
            </span>
            <code className="rounded-md bg-muted px-2 py-1 text-xs">
              {manualEntryKey}
            </code>
          </div>
          <Input
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value)}
            placeholder="Code à 6 chiffres"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            required
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleDone}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Vérification..." : "Confirmer"}
            </Button>
          </div>
        </form>
      )}

      {step === "backup-codes" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Enregistrez ces codes de secours dans un endroit sûr. Chacun ne peut
            être utilisé qu&apos;une seule fois si vous perdez l&apos;accès à
            votre application.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4 font-mono text-sm">
            {backupCodes.map((code) => (
              <span key={code}>{code}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={copyBackupCodes}
              className="gap-2"
            >
              <Copy className="h-3.5 w-3.5" />
              Copier
            </Button>
            <Button onClick={handleDone}>J&apos;ai sauvegardé mes codes</Button>
          </div>
        </div>
      )}
    </div>
  );
}
