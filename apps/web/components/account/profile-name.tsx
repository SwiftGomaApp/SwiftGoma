"use client";

import { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isApiError } from "@/lib/api/client";
import { updateProfile } from "@/lib/api/routes/users.routes";
import { useAuth } from "@/lib/auth/auth-context";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Name",
    description: "The name shown on your orders and profile.",
    edit: "Edit",
    nameLabel: "Full name",
    save: "Save",
    cancel: "Cancel",
    tooShort: "Please enter your full name.",
    genericError: "Something went wrong. Please try again.",
  },
  fr: {
    title: "Nom",
    description: "Le nom affiché sur vos commandes et votre profil.",
    edit: "Modifier",
    nameLabel: "Nom complet",
    save: "Enregistrer",
    cancel: "Annuler",
    tooShort: "Veuillez entrer votre nom complet.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
  },
} as const;

function extractMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}

export function ProfileName({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const { user, refresh } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setName(user?.name ?? "");
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError(t.tooShort);
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({ name: trimmed });
      await refresh();
      setEditing(false);
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
            {editing ? t.description : (user?.name ?? "")}
          </p>
        </div>

        {!editing && (
          <Button type="button" variant="outline" onClick={startEditing}>
            <Pencil className="size-4" />
            {t.edit}
          </Button>
        )}
      </div>

      {editing && (
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5 sm:max-w-sm">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="profile-name">{t.nameLabel}</FieldLabel>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
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
                onClick={handleSubmit}
                disabled={submitting || !name.trim()}
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {t.save}
              </Button>
              <Button type="button" variant="ghost" onClick={cancel}>
                {t.cancel}
              </Button>
            </div>
          </FieldGroup>
        </div>
      )}
    </section>
  );
}

export default ProfileName;
