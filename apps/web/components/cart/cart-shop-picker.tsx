"use client";

import { Store, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Cart } from "@/lib/api/routes/cart";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currency === "CDF" ? 0 : 2,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(price);
}

type CartShopPickerProps = {
  carts: Cart[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (shopId: string) => void;
};

export function CartShopPicker({
  carts,
  open,
  onOpenChange,
  onPick,
}: CartShopPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Vos paniers</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {carts.map((cart) => {
            const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
            const total = cart.items.reduce(
              (sum, i) =>
                sum + (i.displayPrice ?? Number(i.variant.price)) * i.quantity,
              0,
            );
            return (
              <button
                key={cart.shopId}
                type="button"
                onClick={() => onPick(cart.shopId)}
                className="flex items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Store className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {cart.shop?.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {itemCount} article{itemCount > 1 ? "s" : ""} ·{" "}
                    {formatPrice(total, cart.cartCurrency ?? "USD")}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
