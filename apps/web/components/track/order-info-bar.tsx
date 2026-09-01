"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { distanceKm } from "@/lib/geo";
import type { OrderDetail } from "@/lib/orders";
import type { RiderLocation } from "@/hooks/use-order-tracking";

type Locale = "en" | "fr";

const AVERAGE_SPEED_KMH = 25;

const STRINGS = {
  en: {
    orderId: "Order ID",
    contactCourier: "Contact courier",
    from: "From",
    to: "To",
    distance: "Distance",
    eta: "ETA",
    calculating: "Calculating…",
  },
  fr: {
    orderId: "N° de commande",
    contactCourier: "Contacter le livreur",
    from: "De",
    to: "À",
    distance: "Distance",
    eta: "Arrivée estimée",
    calculating: "Calcul…",
  },
} as const;

function formatEta(minutes: number, locale: Locale) {
  const arrival = new Date(Date.now() + minutes * 60_000);
  const time = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(arrival);
  const roundedMinutes = Math.max(1, Math.round(minutes));
  return `${time} (${roundedMinutes} min)`;
}

export function OrderInfoBar({
  order,
  locale,
  riderLocation,
  onContactCourier,
}: {
  order: OrderDetail;
  locale: Locale;
  riderLocation: RiderLocation | null;
  onContactCourier: () => void;
}) {
  const t = STRINGS[locale];

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasDelivery =
    order.deliveryLatitude != null && order.deliveryLongitude != null;
  const hasShop = order.shop.latitude != null && order.shop.longitude != null;

  const remainingDistance =
    hasDelivery && riderLocation
      ? distanceKm(
          { lat: riderLocation.latitude, lng: riderLocation.longitude },
          { lat: order.deliveryLatitude!, lng: order.deliveryLongitude! },
        )
      : hasDelivery && hasShop
        ? distanceKm(
            { lat: order.shop.latitude!, lng: order.shop.longitude! },
            { lat: order.deliveryLatitude!, lng: order.deliveryLongitude! },
          )
        : null;

  const eta =
    mounted && remainingDistance != null
      ? formatEta((remainingDistance / AVERAGE_SPEED_KMH) * 60, locale)
      : null;

  return (
    <div className="flex flex-col gap-4 border-t border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold text-foreground">
          {t.orderId} #{order.id.slice(0, 8)}
        </p>
        <OrderStatusBadge status={order.status} locale={locale} />
      </div>

      <Button type="button" variant="outline" onClick={onContactCourier}>
        <Phone className="size-4" />
        {t.contactCourier}
      </Button>

      <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 sm:gap-8">
        <div>
          <p className="text-muted-foreground">{t.from}</p>
          <p className="mt-0.5 truncate font-medium text-foreground">
            {order.shop.name}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">{t.to}</p>
          <p className="mt-0.5 truncate font-medium text-foreground">
            {order.deliveryAddress || "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">{t.distance}</p>
          <p className="mt-0.5 font-medium text-foreground">
            {remainingDistance != null
              ? `${remainingDistance.toFixed(1)} km`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">{t.eta}</p>
          <p className="mt-0.5 font-medium text-foreground">
            {eta ?? t.calculating}
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderInfoBar;
