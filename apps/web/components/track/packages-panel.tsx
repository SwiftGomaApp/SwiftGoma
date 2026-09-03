"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  Copy,
  Loader2,
  MessageCircle,
  Phone,
  QrCode,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { formatMoney } from "@/lib/products";
import { distanceKm } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { getOrderQrCode } from "@/lib/api/routes/orders.routes";
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

// The QR token is only valid before handoff — hide the button once it can
// no longer be used (already delivered, or the order never will be).
const QR_HIDDEN_STATUSES: OrderStatus[] = [
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "FAILED",
  "DELIVERED",
  "COMPLETED",
];

const STRINGS = {
  en: {
    packages: "Packages",
    onTheWay: "On the way",
    orderId: "Order ID",
    shop: "Shop",
    departed: "Departed",
    distance: "Distance",
    courier: "Courier",
    details: "Delivery history and details",
    noRider: "Waiting for a rider to be assigned…",
    showQr: "Show handoff QR code",
    handoffQr: "Handoff QR code",
    qrHint: "Show this to the rider to confirm handoff.",
    tokenLabel: "Or share this code manually",
    copy: "Copy",
    copied: "Copied",
    qrError: "Couldn't load the QR code.",
  },
  fr: {
    packages: "Colis",
    onTheWay: "En route",
    orderId: "N° de commande",
    shop: "Boutique",
    departed: "Départ",
    distance: "Distance",
    courier: "Livreur",
    details: "Historique et détails de la livraison",
    noRider: "En attente de l'assignation d'un livreur…",
    showQr: "Afficher le QR code de remise",
    handoffQr: "QR code de remise",
    qrHint: "Montrez ceci au livreur pour confirmer la remise.",
    tokenLabel: "Ou partagez ce code manuellement",
    copy: "Copier",
    copied: "Copié",
    qrError: "Impossible de charger le QR code.",
  },
} as const;

function formatTime(iso: string | null, locale: Locale) {
  if (!iso) return "—";
  // Pinned to Goma's zone (no DST) so SSR and the client always agree —
  // resolving the runtime's local zone here would hydration-mismatch
  // whenever the server and browser sit in different timezones.
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lubumbashi",
  }).format(new Date(iso));
}

export function PackagesPanel({
  order,
  locale,
  onOpenChat,
}: {
  order: OrderDetail;
  locale: Locale;
  onOpenChat: () => void;
}) {
  const t = STRINGS[locale];
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentIndex = DELIVERY_STEPS.indexOf(order.status);
  const progress = Math.max(
    0,
    Math.min(100, (currentIndex / (DELIVERY_STEPS.length - 1)) * 100),
  );

  const distance =
    order.shop.latitude != null &&
    order.shop.longitude != null &&
    order.deliveryLatitude != null &&
    order.deliveryLongitude != null
      ? distanceKm(
          { lat: order.shop.latitude, lng: order.shop.longitude },
          { lat: order.deliveryLatitude, lng: order.deliveryLongitude },
        )
      : null;

  function handleOpenQr() {
    setQrOpen(true);
    setQrError(false);
    setQrLoading(true);
    getOrderQrCode(order.id)
      .then((res) => {
        setQrCodeDataUrl(res.qrCodeDataUrl);
        setQrToken(res.qrToken);
      })
      .catch(() => setQrError(true))
      .finally(() => setQrLoading(false));
  }

  async function handleCopyToken() {
    if (!qrToken) return;
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopied(true);
      toast.add({ title: t.copied, type: "success" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.add({ title: t.qrError, type: "error" });
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <h2 className="text-lg font-semibold text-foreground">{t.packages}</h2>

      <span className="inline-flex w-fit items-center rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
        {t.onTheWay}
      </span>

      <div className="rounded-xl border border-border p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            {order.shop.name} → {order.deliveryAddress || "—"}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t.orderId} #{order.id.slice(0, 8)}
        </p>

        <div className="mt-3 flex justify-center">
          <OrderStatusBadge status={order.status} locale={locale} />
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
          <div>
            <p className="text-muted-foreground">{t.shop}</p>
            <p className="mt-0.5 font-medium text-foreground">
              {order.shop.name}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t.departed}</p>
            <p className="mt-0.5 font-medium text-foreground">
              {formatTime(order.pickedUpAt, locale)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t.distance}</p>
            <p className="mt-0.5 font-medium text-foreground">
              {distance != null ? `${distance.toFixed(1)} km` : "—"}
            </p>
          </div>
        </div>

        {order.rider ? (
          <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              {order.rider.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground">{t.courier}</p>
              <p className="truncate text-sm font-medium text-foreground">
                {order.rider.user.name}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={onOpenChat}
            >
              <MessageCircle className="size-3.5" />
            </Button>
            {order.rider.user.phone && (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                nativeButton={false}
                render={<a href={`tel:${order.rider.user.phone}`} />}
              >
                <Phone className="size-3.5" />
              </Button>
            )}
          </div>
        ) : (
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            {t.noRider}
          </p>
        )}

        {!QR_HIDDEN_STATUSES.includes(order.status) && (
          <button
            type="button"
            onClick={handleOpenQr}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            <QrCode className="size-3.5" />
            {t.showQr}
          </button>
        )}

        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="mt-4 flex w-full items-center justify-between border-t border-border pt-3 text-xs font-medium text-foreground"
        >
          {t.details}
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              detailsOpen && "rotate-180",
            )}
          />
        </button>

        {detailsOpen && (
          <div className="mt-2 space-y-1.5">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border p-2 text-xs"
              >
                <span className="truncate text-foreground">
                  {item.quantity}× {item.productName}
                  {item.variantName ? ` · ${item.variantName}` : ""}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {formatMoney(Number(item.unitPrice), order.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.handoffQr}</DialogTitle>
          </DialogHeader>

          {qrLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!qrLoading && qrError && (
            <p className="py-6 text-center text-sm text-destructive">
              {t.qrError}
            </p>
          )}

          {!qrLoading && !qrError && qrCodeDataUrl && (
            <div className="flex flex-col items-center gap-3">
              <Image
                src={qrCodeDataUrl}
                alt=""
                width={260}
                height={260}
                unoptimized
                className="h-auto w-full max-w-[220px]"
              />
              <p className="text-center text-xs text-muted-foreground">
                {t.qrHint}
              </p>

              {qrToken && (
                <div className="flex w-full flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground">
                    {t.tokenLabel}
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border border-border p-2">
                    <code className="flex-1 truncate text-xs">{qrToken}</code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={handleCopyToken}
                    >
                      {copied ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PackagesPanel;
