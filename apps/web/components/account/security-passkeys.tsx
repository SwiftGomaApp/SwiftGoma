"use client";

import { useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Loader2 } from "lucide-react";

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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { toast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/client";
import {
  deletePasskey,
  generatePasskeyRegistrationOptions,
  listPasskeys,
  verifyPasskeyRegistration,
  type Passkey,
} from "@/lib/api/routes/auth.routes";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Passkeys",
    description:
      "Sign in without a password using Face ID, Touch ID, or a security key.",
    add: "Add a passkey",
    remove: "Remove",
    removeConfirmTitle: "Remove this passkey?",
    removeConfirmDescription: "You won't be able to use it to sign in anymore.",
    cancel: "Cancel",
    confirmRemove: "Remove passkey",
    empty: "No passkeys added yet.",
    added: "Added",
    lastUsed: "Last used",
    never: "Never used",
    genericError: "Something went wrong. Please try again.",
    cancelled: "Passkey setup was cancelled.",
  },
  fr: {
    title: "Clés d'accès",
    description:
      "Connectez-vous sans mot de passe avec Face ID, Touch ID ou une clé de sécurité.",
    add: "Ajouter une clé d'accès",
    remove: "Retirer",
    removeConfirmTitle: "Retirer cette clé d'accès ?",
    removeConfirmDescription:
      "Vous ne pourrez plus l'utiliser pour vous connecter.",
    cancel: "Annuler",
    confirmRemove: "Retirer la clé",
    empty: "Aucune clé d'accès ajoutée pour le moment.",
    added: "Ajoutée le",
    lastUsed: "Dernière utilisation",
    never: "Jamais utilisée",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    cancelled: "La configuration de la clé d'accès a été annulée.",
  },
} as const;

function formatDate(value: string | null, locale: Locale): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    { dateStyle: "medium" },
  );
}

function extractMessage(err: unknown): string | undefined {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return undefined;
}

export function SecurityPasskeys({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    listPasskeys()
      .then(setPasskeys)
      .catch(() => setPasskeys([]));
  }, []);

  async function handleAdd() {
    setAdding(true);
    try {
      const options = await generatePasskeyRegistrationOptions();
      const response = await startRegistration({ optionsJSON: options });
      const deviceName =
        typeof navigator !== "undefined"
          ? navigator.platform || undefined
          : undefined;
      const passkey = await verifyPasskeyRegistration({
        response,
        deviceName,
      });
      setPasskeys((prev) => [passkey, ...(prev ?? [])]);
    } catch (err) {
      const isCancelled =
        err instanceof Error &&
        (err.name === "NotAllowedError" || err.name === "AbortError");
      toast.add({
        title: isCancelled ? t.cancelled : t.genericError,
        description: isCancelled ? undefined : extractMessage(err),
        type: isCancelled ? "info" : "error",
      });
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      await deletePasskey(id);
      setPasskeys((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } catch (err) {
      toast.add({
        title: t.genericError,
        description: extractMessage(err),
        type: "error",
      });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={adding}
        >
          {adding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Fingerprint className="size-4" />
          )}
          {t.add}
        </Button>
      </div>

      {passkeys === null ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : passkeys.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ItemGroup>
          {passkeys.map((passkey) => (
            <Item key={passkey.id} variant="outline">
              <ItemMedia variant="icon">
                <Fingerprint />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{passkey.deviceName ?? t.title}</ItemTitle>
                <ItemDescription>
                  {t.added} {formatDate(passkey.createdAt, locale)} ·{" "}
                  {passkey.lastUsedAt
                    ? `${t.lastUsed} ${formatDate(passkey.lastUsedAt, locale)}`
                    : t.never}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={removingId === passkey.id}
                      />
                    }
                  >
                    {removingId === passkey.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      t.remove
                    )}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t.removeConfirmTitle}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.removeConfirmDescription}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                      <Button
                        variant="destructive"
                        onClick={() => handleRemove(passkey.id)}
                      >
                        {t.confirmRemove}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}
    </section>
  );
}

export default SecurityPasskeys;
