"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useCart } from "@/lib/cart/cart-context";
import { formatMoney } from "@/lib/products";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Your cart",
    emptyTitle: "Your cart is empty",
    emptyDescription: "Browse products and add something you like.",
    subtotal: "Subtotal",
    checkout: "Checkout",
    clearShop: "Clear",
    remove: "Remove",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    conversionUnavailable: "Price unavailable in this currency",
  },
  fr: {
    title: "Votre panier",
    emptyTitle: "Votre panier est vide",
    emptyDescription: "Parcourez les produits et ajoutez ce qui vous plaît.",
    subtotal: "Sous-total",
    checkout: "Passer la commande",
    clearShop: "Vider",
    remove: "Retirer",
    decrease: "Diminuer la quantité",
    increase: "Augmenter la quantité",
    conversionUnavailable: "Prix indisponible dans cette devise",
  },
} as const;

export function CartModal({
  open,
  onOpenChange,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
}) {
  const t = STRINGS[locale];
  const router = useRouter();
  const { carts, updateQuantity, removeItem, clearShopCart } = useCart();

  const hasItems = carts.some((cart) => cart.items.length > 0);

  function goToCheckout(shopId: string) {
    onOpenChange(false);
    router.push(`/checkout/${shopId}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>

        {!hasItems ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingCart />
              </EmptyMedia>
              <EmptyTitle>{t.emptyTitle}</EmptyTitle>
              <EmptyDescription>{t.emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-6">
            {carts.map((cart) => {
              if (cart.items.length === 0 || !cart.shop) return null;

              const subtotal = cart.items.reduce(
                (sum, item) =>
                  item.displayPrice != null
                    ? sum + item.displayPrice * item.quantity
                    : sum,
                0,
              );

              return (
                <div
                  key={cart.shopId}
                  className="flex flex-col gap-4 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {cart.shop.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => clearShopCart(cart.shopId)}
                    >
                      {t.clearShop}
                    </Button>
                  </div>

                  <ul className="flex flex-col gap-4">
                    {cart.items.map((item) => {
                      const image = item.variant.product.images[0]?.url;
                      return (
                        <li key={item.id} className="flex items-center gap-3">
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-foreground">
                            {image && (
                              <Image
                                src={image}
                                alt={item.variant.product.name}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <Link
                              href={`/products/${item.variant.product.slug}`}
                              onClick={() => onOpenChange(false)}
                              className="truncate text-sm font-medium text-foreground hover:text-primary"
                            >
                              {item.variant.product.name}
                            </Link>
                            <span className="text-sm text-muted-foreground">
                              {item.displayPrice != null && cart.cartCurrency
                                ? formatMoney(
                                    item.displayPrice,
                                    cart.cartCurrency,
                                  )
                                : t.conversionUnavailable}
                            </span>

                            <div className="mt-1 flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label={t.decrease}
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                              >
                                <Minus className="size-3.5" />
                              </Button>
                              <span className="w-6 text-center text-sm tabular-nums">
                                {item.quantity}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label={t.increase}
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                              >
                                <Plus className="size-3.5" />
                              </Button>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t.remove}
                            onClick={() => removeItem(item.id)}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                    <span className="text-muted-foreground">
                      {t.subtotal}
                    </span>
                    <span className="font-medium text-foreground">
                      {cart.cartCurrency
                        ? formatMoney(subtotal, cart.cartCurrency)
                        : "—"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={() => goToCheckout(cart.shopId)}
                  >
                    {t.checkout}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CartModal;
