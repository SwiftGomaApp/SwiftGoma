"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MapPinOff,
  Navigation,
  Radio,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DevRiderSimulator } from "@/components/orders/dev-rider-simulator";
import { OrderTrackingMap } from "@/components/orders/order-tracking-map";
import { useOrderTracking } from "@/hooks/use-order-tracking";
import { ordersApi, type Order } from "@/lib/api/routes/orders";
import { ApiException } from "@/lib/api";
import {
  isOrderTrackable,
  ORDER_STATUS_LABELS,
  orderStatusBadgeVariant,
} from "@/lib/orders";
import type { LiveLocation } from "@/lib/order-tracking";
import { cn } from "@/lib/utils";

const IS_DEV = process.env.NODE_ENV === "development";

export default function OrderTrackPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulatedRider, setSimulatedRider] = useState<LiveLocation | null>(
    null,
  );
  const [simulationActive, setSimulationActive] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    ordersApi
      .getOrder(params.orderId)
      .then(setOrder)
      .catch((err) =>
        setError(
          err instanceof ApiException
            ? err.message
            : "Impossible de charger la commande.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [params.orderId]);

  const canTrack =
    order != null &&
    isOrderTrackable(order.status, order.fulfillmentMethod) &&
    order.deliveryLatitude != null &&
    order.deliveryLongitude != null;

  const { riderLocation, joined, joinError, isLive } = useOrderTracking(
    params.orderId,
    canTrack,
  );

  const displayRiderLocation = simulatedRider ?? riderLocation;

  useEffect(() => {
    if (!order || isLoading) return;
    if (!isOrderTrackable(order.status, order.fulfillmentMethod)) {
      router.replace(`/orders/${order.id}`);
    }
  }, [order, isLoading, router]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <MapPinOff className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {error ?? "Commande introuvable."}
        </p>
        <Button render={<Link href="/orders" />} nativeButton={false}>
          Mes commandes
        </Button>
      </div>
    );
  }

  if (
    order.deliveryLatitude == null ||
    order.deliveryLongitude == null ||
    !canTrack
  ) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <MapPinOff className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Adresse de livraison indisponible
        </p>
        <p className="text-sm text-muted-foreground">
          Cette commande n&apos;a pas de coordonnées GPS pour le suivi.
        </p>
        <Button
          render={<Link href={`/orders/${order.id}`} />}
          nativeButton={false}
        >
          Retour à la commande
        </Button>
      </div>
    );
  }

  const destination = {
    latitude: order.deliveryLatitude,
    longitude: order.deliveryLongitude,
  };

  return (
    <>
      <div className="absolute inset-0">
        <OrderTrackingMap
          destination={destination}
          riderLocation={displayRiderLocation}
          className="h-full w-full"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto mx-auto w-full max-w-lg rounded-2xl border border-border/80 bg-card p-4 shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    Suivi en direct
                  </p>
                  <Badge variant={orderStatusBadgeVariant(order.status)}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  {simulationActive && IS_DEV && (
                    <Badge variant="outline">Simulation active</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {order.shop?.name ?? "Votre commande"}
                </p>
              </div>
            </div>

            {order.deliveryAddress && (
              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {order.deliveryAddress}
              </p>
            )}

            <div
              className={cn(
                "mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium",
                (isLive && displayRiderLocation) || simulationActive
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {(isLive && displayRiderLocation) || simulationActive ? (
                <>
                  <Radio className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                  {simulationActive
                    ? "Position simulée du livreur"
                    : "Position du livreur mise à jour"}
                </>
              ) : isLive && !displayRiderLocation ? (
                <>
                  <Navigation className="h-3.5 w-3.5 shrink-0" />
                  En attente de la position du livreur…
                </>
              ) : (
                <>
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  Connexion au suivi…
                </>
              )}
            </div>

            {joinError && (
              <p className="mt-2 text-xs text-destructive">{joinError}</p>
            )}

            {!joined && !joinError && !simulationActive && (
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Le pin orange est votre adresse. Le livreur apparaît dès
                qu&apos;il partage sa position.
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                render={<Link href={`/orders/${order.id}`} />}
                nativeButton={false}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              {IS_DEV && (
                <DevRiderSimulator
                  active={simulationActive}
                  destination={destination}
                  onLocation={setSimulatedRider}
                  onActiveChange={setSimulationActive}
                  className="flex-1"
                />
              )}
            </div>
          </div>
        </div>
    </>
  );
}
