"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LocateFixed,
  Map,
  Mountain,
  Package,
  Satellite,
  X,
} from "lucide-react";
import { useOrderTracking } from "@/hooks/use-order-tracking";
import {
  TrackMap,
  MAP_STYLES,
  type MapStyleId,
  type RouteLine,
  type TrackMapHandle,
} from "@/components/track/track-map";
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
import { fetchRoute, type RouteResult } from "@/lib/directions";
import { cn } from "@/lib/utils";

type Locale = "en" | "fr";

const YOU_LABEL: Record<Locale, string> = { en: "You", fr: "Vous" };

const PLANNED_ROUTE_COLOR = "#eab308"; // yellow — shop to buyer
const LIVE_ROUTE_COLOR = "#ea580c"; // primary — rider to shop

const LEGEND_STRINGS = {
  en: { planned: "Shop → You", live: "Rider → You" },
  fr: { planned: "Boutique → Vous", live: "Livreur → Vous" },
} as const;

const STYLE_ICONS: Record<MapStyleId, typeof Map> = {
  streets: Map,
  satellite: Satellite,
  terrain: Mountain,
};

const STYLE_LABELS: Record<Locale, Record<MapStyleId, string>> = {
  en: { streets: "Streets", satellite: "Satellite", terrain: "Terrain" },
  fr: { streets: "Rues", satellite: "Satellite", terrain: "Relief" },
};

const CONTROL_STRINGS = {
  en: { recenter: "Recenter" },
  fr: { recenter: "Recentrer" },
} as const;

export function TrackView({
  order,
  locale,
}: {
  order: OrderDetail;
  locale: Locale;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [packagesOpen, setPackagesOpen] = useState(false);
  const [plannedRoute, setPlannedRoute] = useState<RouteResult | null>(null);
  const [liveRoute, setLiveRoute] = useState<RouteResult | null>(null);
  const [activeStyle, setActiveStyle] = useState<MapStyleId>("streets");
  const trackMapRef = useRef<TrackMapHandle>(null);
  const trackingEnabled = RIDER_HOLDING_STATUSES.includes(order.status);
  const { riderLocation, status } = useOrderTracking(order.id, trackingEnabled);

  const liveOrder =
    status && status !== order.status ? { ...order, status } : order;

  const from =
    order.shop.latitude != null && order.shop.longitude != null
      ? { lat: order.shop.latitude, lng: order.shop.longitude, label: order.shop.name }
      : null;

  const to =
    order.deliveryLatitude != null && order.deliveryLongitude != null
      ? {
          lat: order.deliveryLatitude,
          lng: order.deliveryLongitude,
          label: YOU_LABEL[locale],
        }
      : null;

  const rider = riderLocation
    ? {
        lat: riderLocation.latitude,
        lng: riderLocation.longitude,
        label: liveOrder.rider?.user.name,
      }
    : null;

  // Planned route: shop to the delivery point — the fixed reference path
  // for the whole trip, independent of where the rider currently is.
  useEffect(() => {
    if (!from || !to) {
      setPlannedRoute(null);
      return;
    }
    let cancelled = false;
    fetchRoute(from, to)
      .then((result) => {
        if (!cancelled) setPlannedRoute(result);
      })
      .catch(() => {
        if (!cancelled) setPlannedRoute(null);
      });
    return () => {
      cancelled = true;
    };
    // from/to are re-derived as new object literals every render; depending
    // on them directly would refetch on every render instead of only when
    // the actual coordinates change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from?.lat, from?.lng, to?.lat, to?.lng]);

  // Live route: the rider's current position to the buyer's delivery point.
  useEffect(() => {
    if (!rider || !to) {
      setLiveRoute(null);
      return;
    }
    let cancelled = false;
    fetchRoute(rider, to)
      .then((result) => {
        if (!cancelled) setLiveRoute(result);
      })
      .catch(() => {
        if (!cancelled) setLiveRoute(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider?.lat, rider?.lng, to?.lat, to?.lng]);

  const routes: RouteLine[] = [
    ...(plannedRoute
      ? [{ id: "planned", coordinates: plannedRoute.coordinates, color: PLANNED_ROUTE_COLOR }]
      : []),
    ...(liveRoute
      ? [{ id: "live", coordinates: liveRoute.coordinates, color: LIVE_ROUTE_COLOR }]
      : []),
  ];
  const legend = LEGEND_STRINGS[locale];
  const styleLabels = STYLE_LABELS[locale];
  const controlStrings = CONTROL_STRINGS[locale];

  function handleStyleChange(id: MapStyleId) {
    setActiveStyle(id);
    trackMapRef.current?.setMapStyle(id);
  }

  return (
    <div className="relative h-dvh w-dvw overflow-hidden">
      <TrackMap
        ref={trackMapRef}
        from={from}
        to={to}
        rider={rider}
        routes={routes}
        locale={locale}
        className="absolute inset-0"
      />

      <div className="absolute right-4 top-4 z-10 flex flex-col items-end gap-2">
        {routes.length > 0 && (
          <div className="rounded-xl border border-border bg-background/95 p-3 text-xs shadow-lg backdrop-blur">
            {plannedRoute && (
              <div className="flex items-center gap-2">
                <span
                  className="h-1 w-5 rounded-full"
                  style={{ backgroundColor: PLANNED_ROUTE_COLOR }}
                />
                <span className="text-muted-foreground">{legend.planned}</span>
              </div>
            )}
            {liveRoute && (
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className="h-1 w-5 rounded-full"
                  style={{ backgroundColor: LIVE_ROUTE_COLOR }}
                />
                <span className="text-muted-foreground">{legend.live}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1 rounded-xl border border-border bg-background/95 p-1 shadow-lg backdrop-blur">
          <button
            type="button"
            title={controlStrings.recenter}
            onClick={() => trackMapRef.current?.recenter()}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LocateFixed className="size-4" />
          </button>
          <div className="mx-1 h-px bg-border" />
          {MAP_STYLES.map(({ id }) => {
            const Icon = STYLE_ICONS[id];
            return (
              <button
                key={id}
                type="button"
                title={styleLabels[id]}
                onClick={() => handleStyleChange(id)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground",
                  activeStyle === id && "bg-primary/10 text-primary",
                )}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
      </div>

      {!packagesOpen && (
        <button
          type="button"
          onClick={() => setPackagesOpen(true)}
          className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-border bg-background/95 px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur sm:hidden"
        >
          <Package className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{liveOrder.shop.name}</span>
        </button>
      )}

      <div
        className={cn(
          "absolute inset-x-4 top-4 z-20 sm:right-auto sm:top-4 sm:z-10 sm:block sm:w-96",
          packagesOpen ? "block" : "hidden",
        )}
      >
        <div className="max-h-[80dvh] overflow-y-auto rounded-2xl border border-border bg-background/95 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2 border-b border-border p-3">
            <Link
              href="/account/orders"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <span className="flex-1 text-sm font-medium text-muted-foreground">
              {locale === "fr" ? "Retour aux commandes" : "Back to orders"}
            </span>
            <button
              type="button"
              onClick={() => setPackagesOpen(false)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
            >
              <X className="size-4" />
            </button>
          </div>
          <PackagesPanel
            order={liveOrder}
            locale={locale}
            onOpenChat={() => setChatOpen(true)}
          />
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 w-full max-w-sm -translate-x-1/2 px-4">
        <div className="rounded-xl border border-border bg-background/95 shadow-lg backdrop-blur-sm">
          <OrderInfoBar
            order={liveOrder}
            locale={locale}
            riderLocation={riderLocation}
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
