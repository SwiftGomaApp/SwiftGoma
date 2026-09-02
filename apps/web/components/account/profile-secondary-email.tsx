"use client";

import { useState } from "react";
import { Mail, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isApiError } from "@/lib/api/client";
import {
  deleteSecondaryEmail,
  requestSecondaryEmail,
  verifySecondaryEmail,
} from "@/lib/api/routes/users.routes";
import { useAuth } from "@/lib/auth/auth-context";
import type { Locale } from "@/lib/language";
import {
  OtpDialog,
  type OtpStatus,
} from "@/components/auth/modals/otp-dialog";

const STRINGS = {
  en: {
    title: "Secondary email",
    description: "An extra email address for account recovery and receipts.",
    empty: "No secondary email added yet.",
    add: "Add email",
    verified: "Verified",
    pending: "Pending verification",
    verify: "Verify",
    remove: "Remove",
    emailLabel: "Email address",
    send: "Send code",
    cancel: "Cancel",
    invalidEmail: "Please enter a valid email address.",
    genericError: "Something went wrong. Please try again.",
    otpTitle: "Verify your secondary email",
    otpDescription: "Enter the code we sent to confirm this email address.",
    removeConfirm: "Remove this secondary email?",
  },
  fr: {
    title: "Email secondaire",
    description:
      "Une adresse email supplémentaire pour la récupération de compte et les reçus.",
    empty: "Aucun email secondaire ajouté pour le moment.",
    add: "Ajouter un email",
    verified: "Vérifié",
    pending: "Vérification en attente",
    verify: "Vérifier",
    remove: "Retirer",
    emailLabel: "Adresse email",
    send: "Envoyer le code",
    cancel: "Annuler",
    invalidEmail: "Veuillez entrer une adresse email valide.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    otpTitle: "Vérifiez votre email secondaire",
    otpDescription:
      "Entrez le code que nous avons envoyé pour confirmer cette adresse email.",
    removeConfirm: "Retirer cet email secondaire ?",
  },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}

export function ProfileSecondaryEmail({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const { user, refresh } = useAuth();

  const secondary = (user?.emails ?? []).find((e) => !e.isPrimary) ?? null;

  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");

  function startAdding() {
    setEmail("");
    setError(null);
    setAdding(true);
  }

  function cancelAdding() {
    setAdding(false);
    setError(null);
  }

  async function sendCode(targetEmail: string) {
    setError(null);
    if (!EMAIL_RE.test(targetEmail)) {
      setError(t.invalidEmail);
      return;
    }
    setRequesting(true);
    try {
      await requestSecondaryEmail({ email: targetEmail, locale });
      setEmail(targetEmail);
      setAdding(false);
      setOtpStatus("idle");
      setOtpOpen(true);
    } catch (err) {
      setError(extractMessage(err, t.genericError));
    } finally {
      setRequesting(false);
    }
  }

  async function handleOtpSubmit(code: string) {
    setOtpLoading(true);
    try {
      await verifySecondaryEmail({ code, locale });
      await refresh();
      setOtpStatus("success");
    } catch (err) {
      console.error(err);
      setOtpStatus("error");
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleRemove() {
    if (!window.confirm(t.removeConfirm)) return;
    setRemoving(true);
    try {
      await deleteSecondaryEmail();
      await refresh();
    } catch (err) {
      setError(extractMessage(err, t.genericError));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>

        {!secondary && !adding && (
          <Button type="button" variant="outline" onClick={startAdding}>
            <Mail className="size-4" />
            {t.add}
          </Button>
        )}
      </div>

      {secondary && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 sm:max-w-sm">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{secondary.email}</span>
          </div>

          <div className="flex items-center gap-2">
            {secondary.isVerified ? (
              <Badge variant="secondary">{t.verified}</Badge>
            ) : (
              <>
                <Badge variant="outline">{t.pending}</Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={requesting}
                  onClick={() => sendCode(secondary.email)}
                >
                  {t.verify}
                </Button>
              </>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={t.remove}
              disabled={removing}
              onClick={handleRemove}
            >
              {removing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {!secondary && !adding && (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      )}

      {adding && (
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5 sm:max-w-sm">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="secondary-email">{t.emailLabel}</FieldLabel>
              <Input
                id="secondary-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
                onClick={() => sendCode(email)}
                disabled={requesting || !email.trim()}
              >
                {requesting && <Loader2 className="size-4 animate-spin" />}
                {t.send}
              </Button>
              <Button type="button" variant="ghost" onClick={cancelAdding}>
                {t.cancel}
              </Button>
            </div>
          </FieldGroup>
        </div>
      )}

      <OtpDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        mode="email-verification"
        locale={locale}
        email={email}
        loading={otpLoading}
        status={otpStatus}
        onStatusChange={setOtpStatus}
        title={t.otpTitle}
        description={t.otpDescription}
        onSubmit={handleOtpSubmit}
        onResend={() => sendCode(email)}
        successTitle={t.verified}
        onSuccessAction={() => setOtpOpen(false)}
      />
    </section>
  );
}

export default ProfileSecondaryEmail;
