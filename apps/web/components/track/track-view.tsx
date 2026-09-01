"use client";

import { useState } from "react";
import { useOrderTracking } from "@/hooks/use-order-tracking";
import { TrackMap } from "@/components/track/track-map";
import { PackagesPanel } from "@/components/track/packages-panel";
import { OrderInfoBar } from "@/components/track/order-info-bar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { OrderChat } from "@/components/account/oder-chat";
import { RIDER_HOLDING_STATUSES, type OrderDetail } from "@/lib/orders";

type Locale = "en" | "fr";

export function TrackView({
  order,
  locale,
}: {
  order: OrderDetail;
  locale: Locale;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const trackingEnabled = RIDER_HOLDING_STATUSES.includes(order.status);
  const { riderLocation, status } = useOrderTracking(order.id, trackingEnabled);

  const liveOrder =
    status && status !== order.status ? { ...order, status } : order;

  const from =
    order.shop.latitude != null && order.shop.longitude != null
      ? { lat: order.shop.latitude, lng: order.shop.longitude }
      : null;

  const to =
    order.deliveryLatitude != null && order.deliveryLongitude != null
      ? { lat: order.deliveryLatitude, lng: order.deliveryLongitude }
      : null;

  const rider = riderLocation
    ? { lat: riderLocation.latitude, lng: riderLocation.longitude }
    : null;

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden md:flex-row">
      <div className="max-h-[45vh] w-full shrink-0 overflow-y-auto border-b border-border bg-background md:h-full md:max-h-none md:w-90 md:border-b-0 md:border-r">
        <PackagesPanel
          order={liveOrder}
          locale={locale}
          onOpenChat={() => setChatOpen(true)}
        />
      </div>

      <div className="relative flex-1">
        <TrackMap
          from={from}
          to={to}
          rider={rider}
          locale={locale}
          className="absolute inset-0"
        />

        <div className="absolute inset-x-0 bottom-0 m-4 rounded-xl border border-border bg-background/95 shadow-lg backdrop-blur-sm">
          <OrderInfoBar
            order={liveOrder}
            locale={locale}
            riderLocation={riderLocation}
            onContactCourier={() => setChatOpen(true)}
          />
        </div>
      </div>

      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{locale === "fr" ? "Discussion" : "Chat"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <OrderChat order={liveOrder} locale={locale} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default TrackView;
