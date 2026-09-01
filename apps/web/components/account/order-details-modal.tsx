"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Clock, Loader2, MapPin, Store, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/products";
import OrderChat from "@/components/account/oder-chat";
import { ReorderButton } from "@/components/account/reorder-button";
import {
  confirmOrderReceipt,
  getOrderDetail,
  getOrderQrCode,
} from "@/lib/api/routes/orders.routes";
import type { OrderDetail, OrderStatus } from "@/lib/orders";

type Locale = "en" | "fr";

const DELIVERY_STEPS: OrderStatus[] = [
  "PENDING_SELLER_REVIEW",
  "ACCEPTED",
  "PREPARING",
  "RIDER_ASSIGNED",
  "PICKED_UP",
  "ON_THE_WAY",
  "DELIVERED",
  "COMPLETED",
];
const PICKUP_STEPS: OrderStatus[] = [
  "PENDING_SELLER_REVIEW",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
];
const STOPPED_STATUSES: OrderStatus[] = [
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "FAILED",
];

const STEP_LABELS: Record<Locale, Partial<Record<OrderStatus, string>>> = {
  en: {
    PENDING_SELLER_REVIEW: "Placed",
    ACCEPTED: "Accepted",
    PREPARING: "Preparing",
    READY_FOR_PICKUP: "Ready",
    RIDER_ASSIGNED: "Assigned",
    PICKED_UP: "Picked up",
    ON_THE_WAY: "On the way",
    DELIVERED: "Delivered",
    COMPLETED: "Completed",
  },
  fr: {
    PENDING_SELLER_REVIEW: "Passée",
    ACCEPTED: "Acceptée",
    PREPARING: "Préparation",
    READY_FOR_PICKUP: "Prête",
    RIDER_ASSIGNED: "Assignée",
    PICKED_UP: "Récupérée",
    ON_THE_WAY: "En route",
    DELIVERED: "Livrée",
    COMPLETED: "Terminée",
  },
};

const STRINGS = {
  en: {
    orderInfo: "Order info",
    chat: "Chat",
    items: "Items",
    handoffQr: "Handoff QR code",
    qrHint: "Show this to confirm handoff.",
    subtotal: "Subtotal",
    deliveryFee: "Delivery fee",
    total: "Total",
    createdAt: "Placed on",
    loadError: "Couldn't load this order.",
    confirmDelivery: "Confirm delivery",
    confirming: "Confirming…",
  },
  fr: {
    orderInfo: "Infos commande",
    chat: "Discussion",
    items: "Articles",
    handoffQr: "Code QR de remise",
    qrHint: "Montrez ceci pour confirmer la remise.",
    subtotal: "Sous-total",
    deliveryFee: "Frais de livraison",
    total: "Total",
    createdAt: "Passée le",
    loadError: "Impossible de charger cette commande.",
    confirmDelivery: "Confirmer la réception",
    confirming: "Confirmation…",
  },
} as const;

const STATE_STRINGS = {
  en: {
    completedTitle: "Order confirmed",
    orderItems: "Order items",
    cancelledTitle: "Order cancelled",
    rejectedTitle: "Order rejected",
    expiredTitle: "Order expired",
    failedTitle: "Order failed",
    noReason: "No reason was provided.",
  },
  fr: {
    completedTitle: "Commande confirmée",
    orderItems: "Articles de la commande",
    cancelledTitle: "Commande annulée",
    rejectedTitle: "Commande refusée",
    expiredTitle: "Commande expirée",
    failedTitle: "Échec de la commande",
    noReason: "Aucun motif fourni.",
  },
} as const;

function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function OrderStateBanner({
  order,
  locale,
}: {
  order: OrderDetail;
  locale: Locale;
}) {
  const s = STATE_STRINGS[locale];

  if (order.status !== "CANCELLED" && order.status !== "REJECTED") return null;

  const title =
    order.status === "CANCELLED" ? s.cancelledTitle : s.rejectedTitle;

  const reason =
    order.status === "CANCELLED" ? order.cancelReason : order.rejectionReason;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
      <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {reason || s.noReason}
        </p>
        <div className="mt-3">
          <ReorderButton order={order} locale={locale} />
        </div>
      </div>
    </div>
  );
}

function OrderConfirmedView({
  order,
  locale,
}: {
  order: OrderDetail;
  locale: Locale;
}) {
  const s = STATE_STRINGS[locale];
  return (
    <div className="flex flex-col items-center gap-5  p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border border-emerald-500 ">
        <Check className="size-8 text-emerald-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {s.completedTitle}
      </h3>

      <div className="w-full space-y-2 text-left">
        <p className="text-xs font-medium text-muted-foreground">
          {s.orderItems}
        </p>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5 text-xs"
          >
            <span className="truncate text-foreground">
              {item.productName}
              {item.variantName ? ` · ${item.variantName}` : ""}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {item.quantity} ×{" "}
              {formatMoney(Number(item.unitPrice), order.currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <ReorderButton order={order} locale={locale} />
        <Button
          type="button"
          nativeButton={false}
          render={<Link href={`/shops/${order.shop.slug}`} />}
        >
          {locale === "fr" ? "Voir la boutique" : "Browse shop"}
        </Button>
      </div>
    </div>
  );
}

function OrderFailedView({
  order,
  locale,
}: {
  order: OrderDetail;
  locale: Locale;
}) {
  const s = STATE_STRINGS[locale];
  const title = order.status === "EXPIRED" ? s.expiredTitle : s.failedTitle;

  return (
    <div className="flex flex-col items-center gap-5 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border border-destructive">
        <XCircle className="size-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">
        {order.failureReason || s.noReason}
      </p>

      <div className="flex items-center gap-2">
        <ReorderButton order={order} locale={locale} />
        <Button
          type="button"
          nativeButton={false}
          render={<Link href={`/shops/${order.shop.slug}`} />}
        >
          {locale === "fr" ? "Voir la boutique" : "Browse shop"}
        </Button>
      </div>
    </div>
  );
}

function OrderStepper({
  order,
  locale,
}: {
  order: OrderDetail;
  locale: Locale;
}) {
  const labels = STEP_LABELS[locale];
  if (STOPPED_STATUSES.includes(order.status)) return null;

  const steps =
    order.fulfillmentMethod === "DELIVERY" ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIndex = steps.indexOf(order.status);

  return (
    <div className="flex items-start overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const isDone = index <= currentIndex;
        const isLast = index === steps.length - 1;
        return (
          <div key={step} className="flex shrink-0 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[10px] font-medium",
                  isDone
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-3.5" /> : index + 1}
              </div>
              <span className="w-16 text-center text-[10px] text-muted-foreground">
                {labels[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mt-3 h-px w-6",
                  isDone ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OrderDetailsModal({
  orderId,
  onOpenChange,
  locale,
}: {
  orderId: string | null;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
}) {
  const t = STRINGS[locale];
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setQrCodeDataUrl(null);
      return;
    }

    setLoading(true);
    setError(false);

    getOrderDetail(orderId)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    getOrderQrCode(orderId)
      .then((res) => setQrCodeDataUrl(res.qrCodeDataUrl))
      .catch(() => setQrCodeDataUrl(null));
  }, [orderId]);

  async function handleConfirmDelivery() {
    if (!order) return;
    setConfirming(true);
    try {
      const updated = await confirmOrderReceipt(order.id);
      setOrder(updated);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <Dialog open={!!orderId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl min-w-0">
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && error && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t.loadError}
          </p>
        )}

        {!loading && !error && order && (
          <>
            <DialogHeader>
              <DialogTitle>#{order.id.slice(0, 8)}</DialogTitle>
            </DialogHeader>

            {order.status === "COMPLETED" ? (
              <OrderConfirmedView order={order} locale={locale} />
            ) : order.status === "FAILED" || order.status === "EXPIRED" ? (
              <OrderFailedView order={order} locale={locale} />
            ) : (
              <Tabs defaultValue="info" className="min-w-0">
                <TabsList>
                  <TabsTrigger value="info">{t.orderInfo}</TabsTrigger>
                  <TabsTrigger value="chat">{t.chat}</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="info"
                  className="max-h-[65vh] space-y-5 overflow-y-auto pt-4"
                >
                  <OrderStateBanner order={order} locale={locale} />
                  <OrderStepper order={order} locale={locale} />

                  <div
                    className={
                      !STOPPED_STATUSES.includes(order.status) && qrCodeDataUrl
                        ? "grid grid-cols-2 gap-4"
                        : "grid grid-cols-1 gap-4"
                    }
                  >
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        {t.items}
                      </h3>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-border p-2.5 text-xs"
                          >
                            <p className="truncate font-medium text-foreground">
                              {item.productName}
                            </p>
                            {item.variantName && (
                              <p className="truncate text-muted-foreground">
                                {item.variantName}
                              </p>
                            )}
                            <p className="mt-1 text-muted-foreground">
                              {item.quantity} ×{" "}
                              {formatMoney(
                                Number(item.unitPrice),
                                order.currency,
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {!STOPPED_STATUSES.includes(order.status) &&
                      qrCodeDataUrl && (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t.handoffQr}
                          </p>
                          <Image
                            src={qrCodeDataUrl}
                            alt=""
                            width={300}
                            height={300}
                            unoptimized
                          />
                          <p className="text-center text-[11px] text-muted-foreground">
                            {t.qrHint}
                          </p>
                        </div>
                      )}
                  </div>

                  <div className="space-y-1.5 border-t border-border pt-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t.subtotal}
                      </span>
                      <span className="text-foreground">
                        {formatMoney(Number(order.subtotal), order.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t.deliveryFee}
                      </span>
                      <span className="text-foreground">
                        {formatMoney(Number(order.deliveryFee), order.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                      <span className="text-foreground">{t.total}</span>
                      <span className="text-foreground">
                        {formatMoney(Number(order.total), order.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground flex items-center justify-between">
                    <div>
                      <p className="flex items-center gap-1.5">
                        <Store className="size-3.5" aria-hidden="true" />
                        {order.shop.name}
                      </p>
                      {order.deliveryAddress && (
                        <p className="flex items-center gap-1.5 ">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          {order.deliveryAddress}
                        </p>
                      )}
                      <p className="flex items-center gap-1.5 ">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {t.createdAt} {formatDate(order.createdAt, locale)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {order.status === "DELIVERED" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleConfirmDelivery}
                          disabled={confirming}
                        >
                          {confirming ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          {confirming ? t.confirming : t.confirmDelivery}
                        </Button>
                      )}

                      {order.status === "ON_THE_WAY" && (
                        <Button
                          nativeButton={false}
                          render={
                            <Link href={`/account/orders/${order.id}/track`} />
                          }
                        >
                          {locale === "fr"
                            ? "Suivre la commande"
                            : "Track order"}
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="pt-4">
                  <OrderChat order={order} locale={locale} />
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default OrderDetailsModal;
