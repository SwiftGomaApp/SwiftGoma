"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, XCircle, QrCode as QrCodeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/providers/socket-provider";
import {
  ordersApi,
  type Order,
  type OrderStatus,
} from "@/lib/api/routes/orders";
import { ApiException } from "@/lib/api";

const STATUS_LABEL: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "En attente de paiement",
  PENDING_SELLER_REVIEW: "En attente du vendeur",
  ACCEPTED: "Acceptée",
  PREPARING: "En préparation",
  READY_FOR_PICKUP: "Prête pour retrait",
  RIDER_ASSIGNED: "Livreur assigné",
  PICKED_UP: "Récupérée par le livreur",
  ON_THE_WAY: "En route",
  DELIVERED: "Livrée",
  COMPLETED: "Terminée",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
  EXPIRED: "Expirée",
  FAILED: "Échouée",
};

const TERMINAL_STATUSES: OrderStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
  "FAILED",
];

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currency === "CDF" ? 0 : 2,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(price);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const { socket } = useSocket();
  const [order, setOrder] = useState<Order | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Live status updates via socket
  useEffect(() => {
    if (!socket) return;
    function onStatus(payload: { orderId: string; status: OrderStatus }) {
      if (payload.orderId !== params.orderId) return;
      setOrder((prev) => (prev ? { ...prev, status: payload.status } : prev));
    }
    socket.on("order:status", onStatus);
    return () => {
      socket.off("order:status", onStatus);
    };
  }, [socket, params.orderId]);

  // Polling fallback while awaiting payment, in case the socket drops
  useEffect(() => {
    if (!order || order.status !== "AWAITING_PAYMENT") return;
    const interval = setInterval(() => {
      ordersApi
        .getOrder(params.orderId)
        .then(setOrder)
        .catch(() => {
          // transient error — next tick retries
        });
    }, 4000);
    return () => clearInterval(interval);
  }, [order?.status, params.orderId]);

  // Fetch the handoff QR once the order is past the payment-pending stage
  useEffect(() => {
    if (
      !order ||
      order.status === "AWAITING_PAYMENT" ||
      TERMINAL_STATUSES.includes(order.status)
    ) {
      return;
    }
    ordersApi
      .getOrderQr(order.id)
      .then((r) => setQrCodeDataUrl(r.qrCodeDataUrl))
      .catch(() => {
        // non-critical — page still works without the QR image
      });
  }, [order?.id, order?.status]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-24 text-center">
        <XCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-foreground">
          {error ?? "Commande introuvable."}
        </p>
        <Button render={<Link href="/products" />} nativeButton={false}>
          Retour aux produits
        </Button>
      </div>
    );
  }

  if (order.status === "AWAITING_PAYMENT") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h1 className="text-lg font-semibold text-foreground">
          En attente de confirmation du paiement
        </h1>
        <p className="text-sm text-muted-foreground">
          Vérifiez votre téléphone et approuvez la demande de paiement Mobile
          Money. Cette page se mettra à jour automatiquement.
        </p>
      </div>
    );
  }

  if (order.status === "FAILED") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-24 text-center">
        <XCircle className="h-8 w-8 text-destructive" />
        <h1 className="text-lg font-semibold text-foreground">
          Le paiement a échoué
        </h1>
        {order.failureReason && (
          <p className="text-sm text-muted-foreground">
            {order.failureReason}
          </p>
        )}
        <Button
          render={<Link href={order.shop ? `/shops/${order.shop.slug}` : "/products"} />}
          nativeButton={false}
        >
          Retour à la boutique
        </Button>
      </div>
    );
  }

  const currency = order.currency;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Commande
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge
          variant={
            order.status === "COMPLETED"
              ? "default"
              : TERMINAL_STATUSES.includes(order.status)
                ? "destructive"
                : "secondary"
          }
        >
          {STATUS_LABEL[order.status]}
        </Badge>
      </div>

      {qrCodeDataUrl && (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-border p-6">
          <QrCodeIcon className="h-4 w-4 text-muted-foreground" />
          <Image
            src={qrCodeDataUrl}
            alt="QR code de commande"
            width={200}
            height={200}
          />
          <p className="max-w-xs text-center text-xs text-muted-foreground">
            Présentez ce code{" "}
            {order.fulfillmentMethod === "DELIVERY"
              ? "au livreur"
              : "en boutique"}{" "}
            pour confirmer la remise.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Articles</h2>
        <div className="flex flex-col divide-y divide-border">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <div>
                <p className="font-medium text-foreground">
                  {item.productName}
                </p>
                {item.variantName && (
                  <p className="text-xs text-muted-foreground">
                    {item.variantName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Qté {item.quantity}
                </p>
              </div>
              <span className="font-semibold text-foreground">
                {formatPrice(Number(item.subtotal), currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 rounded-xl border border-border p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mode de réception</span>
          <span className="text-foreground">
            {order.fulfillmentMethod === "DELIVERY"
              ? "Livraison"
              : "Retrait en boutique"}
          </span>
        </div>
        {order.deliveryAddress && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Adresse</span>
            <span className="text-right text-foreground">
              {order.deliveryAddress}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Paiement</span>
          <span className="text-foreground">
            {order.paymentMethod === "CASH_ON_DELIVERY"
              ? "À la livraison"
              : "Mobile Money"}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-3">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">
            {formatPrice(Number(order.total), currency)}
          </span>
        </div>
      </div>
    </main>
  );
}
