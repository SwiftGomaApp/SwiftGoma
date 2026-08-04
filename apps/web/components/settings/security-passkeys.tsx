"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { toast } from "@/lib/toast";
import { Fingerprint, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/routes/auth";
import { ApiException } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

function detectDeviceName() {
  if (typeof navigator === "undefined") return "Appareil";
  const ua = navigator.userAgent;

  const os = /android/i.test(ua)
    ? "Android"
    : /iphone|ipad/i.test(ua)
      ? "iOS"
      : /mac/i.test(ua)
        ? "Mac"
        : /windows/i.test(ua)
          ? "Windows"
          : /linux/i.test(ua)
            ? "Linux"
            : "Appareil";

  const browser = /edg/i.test(ua)
    ? "Edge"
    : /chrome/i.test(ua)
      ? "Chrome"
      : /firefox/i.test(ua)
        ? "Firefox"
        : /safari/i.test(ua)
          ? "Safari"
          : "Navigateur";

  return `${browser} sur ${os}`;
}

export function SecurityPasskeys() {
  const { user, refresh } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const passkeys = user?.passkeys ?? [];

  async function handleAddPasskey() {
    setIsAdding(true);
    try {
      const options = await authApi.generatePasskeyRegistrationOptions();
      const response = await startRegistration({
        optionsJSON: options as never,
      });
      await authApi.verifyPasskeyRegistration({
        response,
        deviceName: detectDeviceName(),
      });
      toast.success("Clé d'accès ajoutée.");
      await refresh();
    } catch (err) {
      if (err instanceof ApiException) {
        toast.error(err.message);
      } else {
        toast.error("Ajout de la clé d'accès annulé ou échoué.");
      }
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(passkeyId: string) {
    setDeletingId(passkeyId);
    try {
      await authApi.deletePasskey(passkeyId);
      toast.success("Clé d'accès supprimée.");
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Clés d&apos;accès
        </h3>
        <p className="text-sm text-muted-foreground">
          Connectez-vous sans mot de passe avec Face ID, Touch ID ou une clé de
          sécurité.
        </p>
      </div>

      {passkeys.length > 0 && (
        <ul className="flex flex-col divide-y divide-border">
          {passkeys.map((passkey) => (
            <li key={passkey.id} className="flex items-center gap-3 py-3">
              <Fingerprint className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {passkey.deviceName ?? "Clé d'accès"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ajoutée le {formatDate(passkey.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(passkey.id)}
                disabled={deletingId === passkey.id}
                aria-label="Supprimer"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="outline"
        onClick={handleAddPasskey}
        disabled={isAdding}
        className="self-start gap-2"
      >
        <Fingerprint className="h-4 w-4" />
        {isAdding ? "Ajout..." : "Ajouter une clé d'accès"}
      </Button>
    </div>
  );
}
