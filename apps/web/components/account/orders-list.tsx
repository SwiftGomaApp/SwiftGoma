"use client";

import { CalendarDays, MapPin, Package, Store, Truck } from "lucide-react";

import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { useOrderDetails } from "@/components/account/order-details-provider";
import { formatMoney } from "@/lib/products";
import type { BuyerOrder } from "@/lib/api/routes/orders";

type Locale = "en" | "fr";

const CARD_STRINGS: Record<
  Locale,
  {
    delivery: string;
    pickup: string;
    itemsOne: (n: number) => string;
    itemsMany: (n: number) => string;
    total: string;
  }
> = {
  en: {
    delivery: "Delivery",
    pickup: "Pickup",
    itemsOne: (n) => `${n} item`,
    itemsMany: (n) => `${n} items`,
    total: "Total",
  },
  fr: {
    delivery: "Livraison",
    pickup: "Retrait",
    itemsOne: (n) => `${n} article`,
    itemsMany: (n) => `${n} articles`,
    total: "Total",
  },
};

function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function OrdersList({
  orders,
  locale,
}: {
  orders: BuyerOrder[];
  locale: Locale;
}) {
  const t = CARD_STRINGS[locale];
  const { openOrderDetails } = useOrderDetails();

  return (
    <div className="mt-4 space-y-4">
        {orders.map((order) => {
          const itemCount = order.items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          return (
            <button
              key={order.id}
              type="button"
              onClick={() => openOrderDetails(order.id)}
              className="block w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-sm font-semibold text-foreground">
                    {order.shop.name}
                  </span>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    {formatDate(order.createdAt, locale)}
                  </div>
                </div>
                <OrderStatusBadge status={order.status} locale={locale} />
              </div>

              <div className="mt-4 space-y-1.5 border-t border-border pt-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-muted-foreground">
                      {item.quantity}× {item.productName}
                      {item.variantName ? ` — ${item.variantName}` : ""}
                    </span>
                    <span className="shrink-0 font-medium text-foreground">
                      {formatMoney(Number(item.subtotal), order.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    {order.fulfillmentMethod === "DELIVERY" ? (
                      <Truck className="size-3.5" aria-hidden="true" />
                    ) : (
                      <Store className="size-3.5" aria-hidden="true" />
                    )}
                    {order.fulfillmentMethod === "DELIVERY"
                      ? t.delivery
                      : t.pickup}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package className="size-3.5" aria-hidden="true" />
                    {itemCount === 1
                      ? t.itemsOne(itemCount)
                      : t.itemsMany(itemCount)}
                  </span>
                  {order.deliveryAddress && (
                    <span className="hidden items-center gap-1.5 sm:flex">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      <span className="max-w-48 truncate">
                        {order.deliveryAddress}
                      </span>
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">{t.total} </span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(Number(order.total), order.currency)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
    </div>
  );
}

export default OrdersList;
