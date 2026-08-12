"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deletePasskey,
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from "@/lib/api/routes/auth";
import { getErrorMessage } from "@/lib/get-error-message";
import { detectDeviceName } from "@/lib/detect-device-name";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { formatDate } from "@/lib/i18n/format";
import { useAuth } from "@/providers/auth-provider";
import type { Passkey } from "@/types/auth";

export function SecurityPasskeysCard() {
  const { user, refetchUser } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const passkeys = (user?.passkeys ?? []) as Passkey[];

  async function handleAddPasskey() {
    setIsAdding(true);
    try {
      const options = await generatePasskeyRegistrationOptions();
      const response = await startRegistration({
        optionsJSON: options as never,
      });
      await verifyPasskeyRegistration({
        response,
        deviceName: detectDeviceName(),
      });
      await refetchUser();
      showSuccessToast(
        "Clé d'accès ajoutée",
        "Vous pouvez désormais vous connecter avec cet appareil.",
      );
    } catch (err) {
      showErrorToast(
        "Impossible d'ajouter la clé d'accès",
        getErrorMessage(err, "L'enregistrement a été annulé ou a échoué."),
      );
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(passkeyId: string) {
    setDeletingId(passkeyId);
    try {
      await deletePasskey(passkeyId);
      await refetchUser();
      showSuccessToast("Clé d'accès supprimée");
    } catch (err) {
      showErrorToast(
        "Impossible de supprimer la clé d'accès",
        getErrorMessage(err, "Réessayez."),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Clés d'accès</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Connectez-vous sans mot de passe avec Face ID, Touch ID ou une clé de
          sécurité.
        </p>

        {passkeys.length > 0 && (
          <ul className="flex flex-col divide-y rounded-lg border">
            {passkeys.map((passkey) => (
              <li key={passkey.id} className="flex items-center gap-3 px-3 py-3">
                <Fingerprint className="text-muted-foreground size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {passkey.deviceName ?? "Clé d'accès"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Ajoutée le {formatDate(passkey.createdAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={deletingId === passkey.id}
                  onClick={() => handleDelete(passkey.id)}
                  aria-label="Supprimer la clé d'accès"
                >
                  <Trash2 className="text-destructive size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-fit gap-2"
          onClick={handleAddPasskey}
          disabled={isAdding}
        >
          <Fingerprint className="size-4" />
          {isAdding ? "Ajout…" : "Ajouter une clé d'accès"}
        </Button>
      </CardContent>
    </Card>
  );
}
