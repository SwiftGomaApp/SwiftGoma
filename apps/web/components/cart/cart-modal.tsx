"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, X, Truck, ShoppingBag } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/providers/cart-provider";
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

function variantLabel(variant: Cart["items"][number]["variant"]) {
  if (variant.attributes) {
    return Object.values(variant.attributes).join(" - ");
  }
  return variant.name ?? "";
}

type CartModalProps = {
  shopId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CartModal({ shopId, open, onOpenChange }: CartModalProps) {
  const router = useRouter();
  const { getCart, updateQuantity, removeItem } = useCart();
  const cart = getCart(shopId);

  const currency = cart?.cartCurrency ?? "USD";
  const totalQuantity =
    cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const itemsTotal =
    cart?.items.reduce(
      (sum, i) => sum + (i.displayPrice ?? Number(i.variant.price)) * i.quantity,
      0,
    ) ?? 0;
  const deliveryFee =
    cart?.displayDeliveryFee ?? (cart?.shop ? Number(cart.shop.deliveryFee) : 0);
  const grandTotal = itemsTotal + deliveryFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-md">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-foreground">Panier</h2>
            {cart?.shop && (
              <span className="text-xs text-muted-foreground">
                {cart.shop.name}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                Votre panier est vide
              </p>
              <p className="text-sm text-muted-foreground">
                Ajoutez des produits pour commencer.
              </p>
            </div>
            <Button
              render={<Link href="/products" />}
              nativeButton={false}
              onClick={() => onOpenChange(false)}
              className="w-full max-w-50"
            >
              Découvrir les produits
            </Button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex flex-col gap-4 overflow-y-auto px-6 py-4">
              {cart.items.map((item) => {
                const image = item.variant.product.images?.[0]?.url;
                const price = item.displayPrice ?? Number(item.variant.price);
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {image ? (
                        <Image
                          src={image}
                          alt={item.variant.product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {item.variant.product.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {variantLabel(item.variant)}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 rounded-full border border-border">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(shopId, item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium tabular-nums text-foreground">
                        {String(item.quantity).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(shopId, item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.variant.stock}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className="w-16 shrink-0 text-right text-sm font-semibold text-foreground">
                      {formatPrice(price * item.quantity, currency)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItem(shopId, item.id)}
                      aria-label="Retirer"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Delivery */}
            {cart.shop && (
              <div className="mx-6 flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium text-foreground">
                    Livraison standard
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Depuis {cart.shop.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {formatPrice(deliveryFee, cart.shop.deliveryFeeCurrency)}
                </span>
              </div>
            )}

            {/* Totals */}
            <div className="flex flex-col gap-2 px-6 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quantité</span>
                <span className="text-foreground">
                  {String(totalQuantity).padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Livraison</span>
                <span className="text-foreground">
                  {formatPrice(deliveryFee, currency)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                <span className="text-base font-semibold text-foreground">
                  Total
                </span>
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(grandTotal, currency)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-border px-6 py-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Continuer mes achats
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/checkout?shopId=${shopId}`);
                }}
                className="flex-1"
              >
                Commander
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
