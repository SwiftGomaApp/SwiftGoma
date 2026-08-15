"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { userApi } from "@/lib/api/routes/user";
import { ApiException } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

const CONFIRM_PHRASE = "supprimer mon compte";

export function SecurityDeleteAccount() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const isConfirmed = confirmText.trim().toLowerCase() === CONFIRM_PHRASE;

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setConfirmText("");
  }

  function blockPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    toast.error("Veuillez taper la phrase, le collage n'est pas autorisé.");
  }

  async function handleConfirmDelete() {
    if (!isConfirmed) return;
    setIsDeleting(true);
    try {
      await userApi.deleteAccount({ reason: reason.trim() || undefined });
      toast.success("Votre compte a été supprimé.");
      handleOpenChange(false);
      await refresh();
      router.push("/");
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
      <div>
        <h3 className="text-sm font-semibold text-destructive">
          Supprimer le compte
        </h3>
        <p className="text-sm text-muted-foreground">
          Cette action désactive votre compte SwiftGoma. Vous pourrez le
          récupérer plus tard via la récupération de compte, tant qu&apos;il
          n&apos;a pas été supprimé définitivement.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="delete-reason">Raison (optionnel)</Label>
        <Textarea
          id="delete-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Dites-nous pourquoi vous partez..."
          rows={3}
        />
      </div>

      <Button
        type="button"
        variant="destructive"
        className="self-start"
        onClick={() => setDialogOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        Supprimer mon compte
      </Button>

      <AlertDialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous serez déconnecté immédiatement. Vous pourrez récupérer votre
              compte plus tard depuis la page de connexion, tant qu&apos;il
              n&apos;a pas été supprimé définitivement par SwiftGoma.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delete-confirm-text">
              Tapez{" "}
              <span className="font-semibold text-foreground">
                {CONFIRM_PHRASE}
              </span>{" "}
              pour confirmer
            </Label>
            <Input
              id="delete-confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onPaste={blockPaste}
              onDrop={(e) => e.preventDefault()}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder={CONFIRM_PHRASE}
              disabled={isDeleting}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Retour</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting || !isConfirmed}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
