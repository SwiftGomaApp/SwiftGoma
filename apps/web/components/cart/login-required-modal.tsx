"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type LoginRequiredModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
};

export function LoginRequiredModal({
  open,
  onOpenChange,
  message = "Vous devez avoir un compte pour ajouter des articles à votre panier.",
}: LoginRequiredModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <LogIn className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-foreground">
              Connectez-vous pour continuer
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {message}
            </p>
          </div>

          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              render={<Link href="/auth/sign-in" />}
              nativeButton={false}
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Se connecter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
