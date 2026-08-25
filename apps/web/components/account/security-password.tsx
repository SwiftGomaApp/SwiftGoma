"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isApiError } from "@/lib/api/client";
import { createPassword, updatePassword } from "@/lib/api/routes/auth.routes";
import { useAuth } from "@/lib/auth/auth-context";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Password",
    descriptionSet: "You don't have a password set for this account yet.",
    descriptionChange: "Change the password used to sign in.",
    setButton: "Set a password",
    changeButton: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    save: "Save",
    cancel: "Cancel",
    otherDevicesNote:
      "Changing your password will sign you out on every other device.",
    tooShort: "Password must be at least 8 characters.",
    mismatch: "Passwords don't match.",
    genericError: "Something went wrong. Please try again.",
    successSet: "Password set.",
    successChange: "Password updated. Other devices have been signed out.",
  },
  fr: {
    title: "Mot de passe",
    descriptionSet: "Aucun mot de passe n'est encore défini pour ce compte.",
    descriptionChange:
      "Modifiez le mot de passe utilisé pour vous connecter.",
    setButton: "Définir un mot de passe",
    changeButton: "Changer le mot de passe",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le nouveau mot de passe",
    save: "Enregistrer",
    cancel: "Annuler",
    otherDevicesNote:
      "Changer votre mot de passe vous déconnectera de tous les autres appareils.",
    tooShort: "Le mot de passe doit contenir au moins 8 caractères.",
    mismatch: "Les mots de passe ne correspondent pas.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    successSet: "Mot de passe défini.",
    successChange:
      "Mot de passe mis à jour. Les autres appareils ont été déconnectés.",
  },
} as const;

function extractMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}

export function SecurityPassword({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const { user, refresh } = useAuth();
  const hasPassword = Boolean(user?.hasPassword);

  const [editing, setEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetForm() {
    setEditing(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError(t.tooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    setSubmitting(true);
    try {
      if (hasPassword) {
        await updatePassword({ currentPassword, newPassword });
        setSuccess(t.successChange);
      } else {
        await createPassword({ password: newPassword });
        setSuccess(t.successSet);
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setEditing(false);
      await refresh();
    } catch (err) {
      setError(extractMessage(err, t.genericError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
          <p className="text-sm text-muted-foreground">
            {hasPassword ? t.descriptionChange : t.descriptionSet}
          </p>
        </div>

        {!editing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditing(true);
              setSuccess(null);
            }}
          >
            <KeyRound className="size-4" />
            {hasPassword ? t.changeButton : t.setButton}
          </Button>
        )}
      </div>

      {success && !editing && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {success}
        </p>
      )}

      {editing && (
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5 sm:max-w-sm">
          <FieldGroup className="gap-3">
            {hasPassword && (
              <Field>
                <FieldLabel htmlFor="current-password">
                  {t.currentPassword}
                </FieldLabel>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="new-password">{t.newPassword}</FieldLabel>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                {t.confirmPassword}
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>

            {hasPassword && (
              <FieldDescription>{t.otherDevicesNote}</FieldDescription>
            )}
            {error && (
              <FieldDescription className="text-destructive">
                {error}
              </FieldDescription>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !newPassword ||
                  !confirmPassword ||
                  (hasPassword && !currentPassword)
                }
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {t.save}
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                {t.cancel}
              </Button>
            </div>
          </FieldGroup>
        </div>
      )}
    </section>
  );
}

export default SecurityPassword;
