"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Navigation, Phone } from "lucide-react";
import {
  completeDelivery,
  getDelivery,
  markFailedDelivery,
  markOnTheWay,
  markPickedUp,
  type DeliveryDetail,
} from "@/lib/api";
import { apiErrorMessage } from "@/lib/api-client";
import { isSignedIn } from "@/lib/auth";
import { useDeliverySocket } from "@/lib/use-delivery-socket";
import { useWatchLocation } from "@/lib/use-watch-location";
import { fetchRoute, type RouteResult } from "@/lib/directions";
import { TrackMap, type MapPoint } from "@/components/track-map";

const LOCATION_ACTIVE_STATUSES = ["RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"];

export default function DeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState<DeliveryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [failReason, setFailReason] = useState("");
  const [showFailForm, setShowFailForm] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);

  const { connected, status: liveStatus, emitLocation } = useDeliverySocket(orderId);

  const locationActive = Boolean(
    order && LOCATION_ACTIVE_STATUSES.includes(order.status),
  );
  const { position: riderPosition, error: locationError } = useWatchLocation(
    locationActive,
    emitLocation,
  );

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/sign-in");
      return;
    }
    getDelivery(orderId)
      .then(setOrder)
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load this delivery.")));
  }, [orderId, router]);

  // Reflect live status pushes from the socket without a full refetch.
  useEffect(() => {
    if (liveStatus) {
      setOrder((prev) => (prev ? { ...prev, status: liveStatus } : prev));
    }
  }, [liveStatus]);

  // One-time route preview from the shop to the fixed delivery point — not
  // recalculated from the rider's live position, which would need request
  // throttling beyond what this template covers.
  useEffect(() => {
    if (!order?.shop.latitude || !order.shop.longitude) return;
    if (!order.deliveryLatitude || !order.deliveryLongitude) return;
    fetchRoute(
      { lat: order.shop.latitude, lng: order.shop.longitude },
      { lat: order.deliveryLatitude, lng: order.deliveryLongitude },
    )
      .then(setRoute)
      .catch(() => setRoute(null));
  }, [order?.shop.latitude, order?.shop.longitude, order?.deliveryLatitude, order?.deliveryLongitude]);

  async function runAction(fn: () => Promise<DeliveryDetail>) {
    setActionLoading(true);
    setError(null);
    try {
      const updated = await fn();
      setOrder(updated);
      setShowFailForm(false);
    } catch (err) {
      setError(apiErrorMessage(err, "That action failed. Try again."));
    } finally {
      setActionLoading(false);
    }
  }

  if (error && !order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Link href="/deliveries" className="text-sm text-primary underline">
          Back to deliveries
        </Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const shopPoint: MapPoint | null =
    order.shop.latitude != null && order.shop.longitude != null
      ? { lat: order.shop.latitude, lng: order.shop.longitude }
      : null;
  const deliveryPoint: MapPoint | null =
    order.deliveryLatitude != null && order.deliveryLongitude != null
      ? { lat: order.deliveryLatitude, lng: order.deliveryLongitude }
      : null;

  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-muted">
      {/* Full-screen map, base layer */}
      <div className="absolute inset-0">
        <TrackMap
          from={shopPoint}
          to={deliveryPoint}
          rider={riderPosition}
          route={route?.coordinates ?? null}
          className="size-full"
        />
      </div>

      {/* Floating header, over the map */}
      <div className="absolute inset-x-3 top-3 z-10 flex items-center gap-3 rounded-2xl bg-background/95 p-3 shadow-lg backdrop-blur">
        <Link
          href="/deliveries"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{order.shop.name}</p>
          <p className="text-xs text-muted-foreground">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <span
          className={`size-2 shrink-0 rounded-full ${connected ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
          title={connected ? "Live" : "Connecting…"}
        />
      </div>

      {/* Floating bottom sheet, over the map */}
      <div className="absolute inset-x-0 bottom-0 z-10 max-h-[65dvh] overflow-y-auto rounded-t-3xl bg-background p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
        <div className="mx-auto flex w-full max-w-md flex-col gap-4">
          <div className="mx-auto -mt-1 h-1 w-10 shrink-0 rounded-full bg-border" />

          {locationError && (
            <p className="text-xs text-destructive">{locationError}</p>
          )}

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium">Deliver to</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.deliveryAddress ?? "No address on file"}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm font-medium">{order.buyer.name}</p>
              {order.buyer.phone && (
                <a
                  href={`tel:${order.buyer.phone}`}
                  className="flex items-center gap-1 text-sm text-primary"
                >
                  <Phone className="size-3.5" />
                  Call
                </a>
              )}
            </div>
          </div>

          {route && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Navigation className="size-3.5" />
              ~{(route.distanceMeters / 1000).toFixed(1)} km ·{" "}
              {Math.round(route.durationSeconds / 60)} min from the shop
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-2">
            {order.status === "RIDER_ASSIGNED" && (
              <button
                disabled={actionLoading}
                onClick={() => runAction(() => markPickedUp(order.id))}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                Mark picked up
              </button>
            )}

            {order.status === "PICKED_UP" && (
              <button
                disabled={actionLoading}
                onClick={() => runAction(() => markOnTheWay(order.id))}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                Start delivery — on the way
              </button>
            )}

            {order.status === "ON_THE_WAY" && (
              <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
                <label className="text-sm font-medium" htmlFor="qr-token">
                  Confirmation code from buyer
                </label>
                <p className="text-xs text-muted-foreground">
                  Ask the buyer to show their delivery QR/code and enter it here.
                  (A real mobile app would scan this with the camera.)
                </p>
                <input
                  id="qr-token"
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  disabled={actionLoading || !qrToken.trim()}
                  onClick={() =>
                    runAction(() => completeDelivery(order.id, qrToken.trim()))
                  }
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  Confirm delivered
                </button>
              </div>
            )}

            {["DELIVERED", "COMPLETED"].includes(order.status) && (
              <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-center text-sm font-medium text-emerald-700">
                Delivered
              </p>
            )}

            {["PICKED_UP", "ON_THE_WAY"].includes(order.status) &&
              (showFailForm ? (
                <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 p-4">
                  <label className="text-sm font-medium" htmlFor="fail-reason">
                    Reason
                  </label>
                  <input
                    id="fail-reason"
                    value={failReason}
                    onChange={(e) => setFailReason(e.target.value)}
                    className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-destructive"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFailForm(false)}
                      className="flex-1 rounded-lg border border-border px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={actionLoading || !failReason.trim()}
                      onClick={() =>
                        runAction(() => markFailedDelivery(order.id, failReason.trim()))
                      }
                      className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Report failed
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowFailForm(true)}
                  className="text-sm text-destructive underline"
                >
                  Report a failed delivery
                </button>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
}
