"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/client";
import { deleteAccount } from "@/lib/api/routes/users.routes";
import { useAuth } from "@/lib/auth/auth-context";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Delete account",
    description:
      "Permanently delete your account and sign out of every device.",
    deleteButton: "Delete account",
    confirmTitle: "Delete your account?",
    confirmDescription:
      "This will sign you out everywhere. You can recover your account within 30 days by contacting support before it's permanently erased.",
    currentPassword: "Current password",
    cancel: "Cancel",
    confirmDelete: "Delete my account",
    wrongPassword: "The current password is incorrect.",
    genericError: "Something went wrong. Please try again.",
    successTitle: "Account deleted",
  },
  fr: {
    title: "Supprimer le compte",
    description:
      "Supprimez définitivement votre compte et déconnectez-vous de tous les appareils.",
    deleteButton: "Supprimer le compte",
    confirmTitle: "Supprimer votre compte ?",
    confirmDescription:
      "Vous serez déconnecté de tous les appareils. Vous pouvez récupérer votre compte dans les 30 jours en contactant le support, avant sa suppression définitive.",
    currentPassword: "Mot de passe actuel",
    cancel: "Annuler",
    confirmDelete: "Supprimer mon compte",
    wrongPassword: "Le mot de passe actuel est incorrect.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    successTitle: "Compte supprimé",
  },
} as const;

function extractMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}

export function SecurityDeleteAccount({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const { user, setUser } = useAuth();
  const hasPassword = Boolean(user?.hasPassword);

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await deleteAccount({
        currentPassword: hasPassword ? password : undefined,
        locale,
      });
      setUser(null);
      toast.add({
        title: t.successTitle,
        description: result.message,
        type: "success",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      setSubmitting(false);
      setError(extractMessage(err, t.genericError));
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>

      <div>
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="destructive" size="sm" />}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {t.deleteButton}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.confirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.confirmDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {hasPassword && (
              <FieldGroup className="gap-3">
                <Field>
                  <FieldLabel htmlFor="delete-account-password">
                    {t.currentPassword}
                  </FieldLabel>
                  <Input
                    id="delete-account-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                {error && (
                  <FieldDescription className="text-destructive">
                    {error}
                  </FieldDescription>
                )}
              </FieldGroup>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={submitting || (hasPassword && !password)}
                onClick={handleDelete}
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {t.confirmDelete}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}

export default SecurityDeleteAccount;
