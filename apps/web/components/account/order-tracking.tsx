"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Check, MapPin, Navigation, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import {
  RIDER_HOLDING_STATUSES,
  type OrderDetail,
  type OrderStatus,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

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

type Locale = "en" | "fr";

const STEP_LABELS: Record<Locale, Partial<Record<OrderStatus, string>>> = {
  en: {
    AWAITING_PAYMENT: "Awaiting payment",
    PENDING_SELLER_REVIEW: "Order placed",
    ACCEPTED: "Accepted by seller",
    PREPARING: "Preparing",
    READY_FOR_PICKUP: "Ready for pickup",
    RIDER_ASSIGNED: "Rider assigned",
    PICKED_UP: "Picked up",
    ON_THE_WAY: "On the way",
    DELIVERED: "Delivered",
    COMPLETED: "Completed",
  },
  fr: {
    AWAITING_PAYMENT: "En attente de paiement",
    PENDING_SELLER_REVIEW: "Commande passée",
    ACCEPTED: "Acceptée par le vendeur",
    PREPARING: "En préparation",
    READY_FOR_PICKUP: "Prête pour retrait",
    RIDER_ASSIGNED: "Livreur assigné",
    PICKED_UP: "Récupérée",
    ON_THE_WAY: "En route",
    DELIVERED: "Livrée",
    COMPLETED: "Terminée",
  },
};

const STOPPED_MESSAGES: Record<Locale, Partial<Record<OrderStatus, string>>> = {
  en: {
    REJECTED: "This order was rejected by the seller.",
    CANCELLED: "This order was cancelled.",
    EXPIRED: "This order expired before it was reviewed.",
    FAILED: "This order could not be completed.",
  },
  fr: {
    REJECTED: "Cette commande a été refusée par le vendeur.",
    CANCELLED: "Cette commande a été annulée.",
    EXPIRED: "Cette commande a expiré avant d'être examinée.",
    FAILED: "Cette commande n'a pas pu être terminée.",
  },
};

const STRINGS = {
  en: {
    trackOrder: "Track order",
    hideTracking: "Hide tracking",
    liveTracking: "Live tracking",
    connecting: "Connecting…",
    connected: "Connected",
    riderInfo: "Your rider",
    noLocationYet: "Waiting for the rider's location…",
    updated: "Updated",
    justNow: "just now",
    secondsAgo: (n: number) => `${n}s ago`,
    minutesAgo: (n: number) => `${n}m ago`,
    coordinates: "Last known position",
  },
  fr: {
    trackOrder: "Suivre la commande",
    hideTracking: "Masquer le suivi",
    liveTracking: "Suivi en direct",
    connecting: "Connexion…",
    connected: "Connecté",
    riderInfo: "Votre livreur",
    noLocationYet: "En attente de la position du livreur…",
    updated: "Mis à jour",
    justNow: "à l'instant",
    secondsAgo: (n: number) => `il y a ${n}s`,
    minutesAgo: (n: number) => `il y a ${n}m`,
    coordinates: "Dernière position connue",
  },
} as const;

function getSocketOrigin() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return base.replace(/\/api\/v1\/?$/, "");
}

function timeAgo(iso: string, t: (typeof STRINGS)[Locale]) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return t.justNow;
  if (seconds < 60) return t.secondsAgo(seconds);
  return t.minutesAgo(Math.floor(seconds / 60));
}

type RiderLocation = { latitude: number; longitude: number; timestamp: string };

function OrderTimeline({
  status,
  fulfillmentMethod,
  locale,
  stopReason,
}: {
  status: OrderStatus;
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  locale: Locale;
  stopReason?: string | null;
}) {
  const labels = STEP_LABELS[locale];
  const stoppedMessage = STOPPED_MESSAGES[locale][status];

  if (stoppedMessage) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <p>{stoppedMessage}</p>
        {stopReason && <p className="mt-1 text-destructive/80">{stopReason}</p>}
      </div>
    );
  }

  const steps = fulfillmentMethod === "DELIVERY" ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIndex = steps.indexOf(status);

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px]",
                  done && "border-primary bg-primary text-primary-foreground",
                  current && "border-primary bg-background text-primary",
                  !done && !current && "border-border bg-background text-transparent",
                )}
              >
                {done && <Check className="size-3" />}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "my-0.5 w-px flex-1",
                    done ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-5 text-sm", current && "font-medium text-foreground", !done && !current && "text-muted-foreground")}>
              {labels[step]}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderTracking({
  order,
  locale,
}: {
  order: OrderDetail;
  locale: Locale;
}) {
  const t = STRINGS[locale];
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [, forceTick] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const canTrack =
    order.fulfillmentMethod === "DELIVERY" &&
    RIDER_HOLDING_STATUSES.includes(status);

  // Re-render every 15s so "updated Ns ago" stays fresh without a full refetch.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (status === "COMPLETED" || STOPPED_STATUSES.includes(status)) return;

    const socket = io(getSocketOrigin(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit(
        "order:join",
        order.id,
        (ack: { lastKnown?: { rider?: RiderLocation | null } } | undefined) => {
          if (ack?.lastKnown?.rider) setRiderLocation(ack.lastKnown.rider);
        },
      );
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on(
      "order:status",
      (payload: { orderId: string; status: OrderStatus }) => {
        if (payload.orderId === order.id) setStatus(payload.status);
      },
    );

    socket.on(
      "location:update",
      (payload: {
        role: string;
        latitude: number;
        longitude: number;
        timestamp: string;
      }) => {
        if (payload.role === "RIDER") {
          setRiderLocation({
            latitude: payload.latitude,
            longitude: payload.longitude,
            timestamp: payload.timestamp,
          });
        }
      },
    );

    return () => {
      socket.emit("order:leave", order.id);
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          {locale === "fr" ? "Statut de la commande" : "Order status"}
        </h2>
        <OrderStatusBadge status={status} locale={locale} />
      </div>

      <div className="mt-5">
        <OrderTimeline
          status={status}
          fulfillmentMethod={order.fulfillmentMethod}
          locale={locale}
          stopReason={
            order.rejectionReason || order.cancelReason || order.failureReason
          }
        />
      </div>

      {canTrack && (
        <div className="mt-2 border-t border-border pt-4">
          <Button
            type="button"
            variant={trackingOpen ? "outline" : "default"}
            className="w-full sm:w-auto"
            onClick={() => setTrackingOpen((v) => !v)}
          >
            <Navigation className="size-4" aria-hidden="true" />
            {trackingOpen ? t.hideTracking : t.trackOrder}
          </Button>

          {trackingOpen && (
            <div className="mt-4 space-y-4 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    connected ? "bg-emerald-500" : "bg-muted-foreground/40",
                  )}
                />
                {connected ? t.connected : t.connecting}
                <span className="font-medium text-foreground">
                  · {t.liveTracking}
                </span>
              </div>

              {order.rider && (
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                    {order.rider.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {order.rider.user.name}
                    </p>
                    {order.rider.user.phone && (
                      <a
                        href={`tel:${order.rider.user.phone}`}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="size-3" aria-hidden="true" />
                        {order.rider.user.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {riderLocation ? (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-foreground">{t.coordinates}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {riderLocation.latitude.toFixed(5)}, {riderLocation.longitude.toFixed(5)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.updated} {timeAgo(riderLocation.timestamp, t)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.noLocationYet}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrderTracking;
