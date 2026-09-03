"use client";

import { useState } from "react";
import { Check, Copy, Download, Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/client";
import {
  confirmTotp,
  disableTotp,
  regenerateBackupCodes,
  setupTotp,
} from "@/lib/api/routes/auth.routes";
import { useAuth } from "@/lib/auth/auth-context";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Two-factor authentication",
    description:
      "Add an extra step when signing in using an authenticator app.",
    enabledBadge: "Enabled",
    disabledBadge: "Disabled",
    enable: "Enable 2FA",
    disable: "Disable 2FA",
    regenerateBackupCodes: "Regenerate backup codes",
    scanTitle: "Scan this QR code",
    scanDescription:
      "Scan with Google Authenticator, Authy, or a similar app, then enter the 6-digit code it shows.",
    manualEntry: "Or enter this key manually:",
    copy: "Copy",
    copied: "Copied",
    code: "6-digit code",
    confirm: "Confirm",
    cancel: "Cancel",
    backupCodesTitle: "Save your backup codes",
    backupCodesDescription:
      "Store these somewhere safe. Each code can be used once if you lose access to your authenticator app.",
    copyAll: "Copy codes",
    copyAllCopied: "Copied",
    download: "Download",
    done: "Done",
    disableTitle: "Disable two-factor authentication?",
    disableDescription:
      "Enter a code from your authenticator app or a backup code to confirm.",
    regenerateTitle: "Regenerate backup codes?",
    regenerateDescription:
      "This invalidates your existing backup codes. Enter a code from your authenticator app to confirm.",
    genericError: "Something went wrong. Please try again.",
    invalidCode: "That code didn't work — try again.",
  },
  fr: {
    title: "Authentification à deux facteurs",
    description:
      "Ajoutez une étape supplémentaire à la connexion via une application d'authentification.",
    enabledBadge: "Activée",
    disabledBadge: "Désactivée",
    enable: "Activer la 2FA",
    disable: "Désactiver la 2FA",
    regenerateBackupCodes: "Régénérer les codes de secours",
    scanTitle: "Scannez ce QR code",
    scanDescription:
      "Scannez avec Google Authenticator, Authy ou une application similaire, puis saisissez le code à 6 chiffres affiché.",
    manualEntry: "Ou saisissez cette clé manuellement :",
    copy: "Copier",
    copied: "Copié",
    code: "Code à 6 chiffres",
    confirm: "Confirmer",
    cancel: "Annuler",
    backupCodesTitle: "Enregistrez vos codes de secours",
    backupCodesDescription:
      "Conservez-les en lieu sûr. Chaque code n'est utilisable qu'une fois si vous perdez l'accès à votre application.",
    copyAll: "Copier les codes",
    copyAllCopied: "Copié",
    download: "Télécharger",
    done: "Terminé",
    disableTitle: "Désactiver l'authentification à deux facteurs ?",
    disableDescription:
      "Saisissez un code de votre application ou un code de secours pour confirmer.",
    regenerateTitle: "Régénérer les codes de secours ?",
    regenerateDescription:
      "Cela invalide vos codes de secours existants. Saisissez un code de votre application pour confirmer.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    invalidCode: "Ce code n'a pas fonctionné — réessayez.",
  },
} as const;

function extractMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}

type Stage = "idle" | "setup" | "backupCodes";

export function SecurityTwoFactor({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const { user, refresh } = useAuth();
  const isEnabled = Boolean(user?.twoFactorEnabled);

  const [stage, setStage] = useState<Stage>("idle");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  async function startSetup() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await setupTotp();
      setQrCodeDataUrl(result.qrCodeDataUrl);
      setManualEntryKey(result.manualEntryKey);
      setStage("setup");
    } catch (err) {
      setError(extractMessage(err, t.genericError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await confirmTotp({ code: code.trim() });
      setBackupCodes(result.backupCodes);
      setStage("backupCodes");
      setCode("");
      await refresh();
    } catch (err) {
      setError(extractMessage(err, t.invalidCode));
    } finally {
      setSubmitting(false);
    }
  }

  function finishBackupCodes() {
    setStage("idle");
    setBackupCodes([]);
  }

  function copyManualKey() {
    navigator.clipboard.writeText(manualEntryKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function copyAllBackupCodes() {
    navigator.clipboard
      .writeText(backupCodes.join("\n"))
      .then(() => {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 1500);
      })
      .catch(() => {
        toast.add({ title: t.genericError, type: "error" });
      });
  }

  function downloadBackupCodes() {
    const blob = new Blob([backupCodes.join("\n") + "\n"], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "swiftgoma-backup-codes.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleDisable(confirmCode: string) {
    await disableTotp({ code: confirmCode });
    await refresh();
  }

  async function handleRegenerate(confirmCode: string) {
    const result = await regenerateBackupCodes({ code: confirmCode });
    setBackupCodes(result.backupCodes);
    setStage("backupCodes");
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              {t.title}
            </h2>
            <Badge variant={isEnabled ? "secondary" : "outline"}>
              {isEnabled ? t.enabledBadge : t.disabledBadge}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>

        {!isEnabled && stage === "idle" && (
          <Button type="button" onClick={startSetup} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {t.enable}
          </Button>
        )}

        {isEnabled && (
          <div className="flex flex-wrap gap-2">
            <CodeConfirmDialog
              trigger={t.regenerateBackupCodes}
              title={t.regenerateTitle}
              description={t.regenerateDescription}
              codeLabel={t.code}
              confirmLabel={t.confirm}
              cancelLabel={t.cancel}
              genericError={t.genericError}
              onConfirm={handleRegenerate}
              variant="outline"
            />
            <CodeConfirmDialog
              trigger={t.disable}
              title={t.disableTitle}
              description={t.disableDescription}
              codeLabel={t.code}
              confirmLabel={t.confirm}
              cancelLabel={t.cancel}
              genericError={t.genericError}
              onConfirm={handleDisable}
              variant="destructive"
            />
          </div>
        )}
      </div>

      {stage === "setup" && (
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeDataUrl}
            alt="TOTP QR code"
            className="size-40 shrink-0 self-center rounded-lg border border-border sm:self-start"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t.scanTitle}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.scanDescription}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t.manualEntry}
              </span>
              <code className="max-w-full truncate rounded-md bg-muted px-2 py-1 text-xs">
                {manualEntryKey}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyManualKey}
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? t.copied : t.copy}
              </Button>
            </div>

            <FieldGroup className="gap-2">
              <Field>
                <FieldLabel htmlFor="totp-code">{t.code}</FieldLabel>
                <Input
                  id="totp-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                />
              </Field>
              {error && (
                <FieldDescription className="text-destructive">
                  {error}
                </FieldDescription>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting || code.trim().length < 6}
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {t.confirm}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStage("idle")}
                >
                  {t.cancel}
                </Button>
              </div>
            </FieldGroup>
          </div>
        </div>
      )}

      {stage === "backupCodes" && (
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t.backupCodesTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {t.backupCodesDescription}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {backupCodes.map((backupCode) => (
              <code
                key={backupCode}
                className="rounded-md bg-muted px-2 py-1.5 text-center text-sm tabular-nums"
              >
                {backupCode}
              </code>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={copyAllBackupCodes}>
              {copiedAll ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copiedAll ? t.copyAllCopied : t.copyAll}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={downloadBackupCodes}
            >
              <Download className="size-4" />
              {t.download}
            </Button>
          </div>
          <Button type="button" onClick={finishBackupCodes} className="w-fit">
            {t.done}
          </Button>
        </div>
      )}
    </section>
  );
}

function CodeConfirmDialog({
  trigger,
  title,
  description,
  codeLabel,
  confirmLabel,
  cancelLabel,
  genericError,
  onConfirm,
  variant,
}: {
  trigger: string;
  title: string;
  description: string;
  codeLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  genericError: string;
  onConfirm: (code: string) => Promise<void>;
  variant: "outline" | "destructive";
}) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const inputId = `code-confirm-${title.replace(/\s+/g, "-").toLowerCase()}`;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(code.trim());
      setOpen(false);
      setCode("");
    } catch (err) {
      setError(extractMessage(err, genericError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant={variant} size="sm" />}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <FieldGroup className="gap-2">
          <Field>
            <FieldLabel htmlFor={inputId}>{codeLabel}</FieldLabel>
            <Input
              id={inputId}
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
            />
          </Field>
          {error && (
            <FieldDescription className="text-destructive">
              {error}
            </FieldDescription>
          )}
        </FieldGroup>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={submitting || code.trim().length < 6}
            onClick={handleSubmit}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default SecurityTwoFactor;
