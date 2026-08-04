"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type EmptyCartModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EmptyCartModal({ open, onOpenChange }: EmptyCartModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-foreground">
              Votre panier est vide
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Parcourez nos produits et ajoutez-en à votre panier pour
              commencer.
            </p>
          </div>

          <Button
            render={<Link href="/products" />}
            nativeButton={false}
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Découvrir les produits
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
