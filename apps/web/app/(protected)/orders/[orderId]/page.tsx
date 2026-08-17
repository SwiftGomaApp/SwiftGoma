"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Copy,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  QrCode as QrCodeIcon,
  Smartphone,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { useSocket } from "@/providers/socket-provider";
import {
  ordersApi,
  type Order,
  type OrderStatus,
} from "@/lib/api/routes/orders";
import { ApiException } from "@/lib/api";
import {
  canCancelOrder,
  FAILED_ORDER_STATUSES,
  getCancelUnavailableMessage,
  getTrackOrderUnavailableMessage,
  isOrderTrackable,
  ORDER_STATUS_LABELS,
  TERMINAL_ORDER_STATUSES,
  formatOrderDate,
  formatOrderPrice,
  formatOrderReference,
  orderStatusBadgeVariant,
} from "@/lib/orders";
import { cn } from "@/lib/utils";
import { OrderChat } from "@/components/orders/order-chat";

function OrderDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-6 py-10">
      <div className="mb-8 h-4 w-32 rounded bg-muted" />
      <div className="mb-2 h-8 w-64 rounded bg-muted" />
      <div className="mb-8 h-4 w-48 rounded bg-muted" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="h-96 rounded-xl bg-muted" />
        <div className="h-80 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function AwaitingPaymentView({ order }: { order: Order }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-6 py-20 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          En attente de paiement
        </h1>
        <p className="text-sm text-muted-foreground">
          Vérifiez votre téléphone et approuvez la demande Mobile Money. Cette
          page se mettra à jour automatiquement.
        </p>
      </div>
      <Card className="w-full text-left">
        <CardContent className="flex items-center justify-between pt-0">
          <span className="text-sm text-muted-foreground">Montant à payer</span>
          <span className="text-lg font-bold text-foreground">
            {formatOrderPrice(Number(order.total), order.currency)}
          </span>
        </CardContent>
      </Card>
      <Button
        variant="outline"
        render={<Link href="/orders" />}
        nativeButton={false}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Mes commandes
      </Button>
    </div>
  );
}

function FailedOrderView({ order }: { order: Order }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {ORDER_STATUS_LABELS[order.status]}
        </h1>
        {order.failureReason && (
          <p className="text-sm text-muted-foreground">{order.failureReason}</p>
        )}
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          render={<Link href="/orders" />}
          nativeButton={false}
        >
          <ArrowLeft className="h-4 w-4" />
          Mes commandes
        </Button>
        <Button
          className="flex-1"
          render={
            <Link
              href={order.shop ? `/shops/${order.shop.slug}` : "/products"}
            />
          }
          nativeButton={false}
        >
          Retour à la boutique
        </Button>
      </div>
    </div>
  );
}

function OrderDetailContent({ order: initialOrder }: { order: Order }) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelUnavailableDialogOpen, setCancelUnavailableDialogOpen] =
    useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    if (!socket) return;
    function onStatus(payload: { orderId: string; status: OrderStatus }) {
      if (payload.orderId !== order.id) return;
      setOrder((prev) => ({ ...prev, status: payload.status }));
    }
    socket.on("order:status", onStatus);
    return () => {
      socket.off("order:status", onStatus);
    };
  }, [socket, order.id]);

  useEffect(() => {
    if (order.status !== "AWAITING_PAYMENT") return;
    const interval = setInterval(() => {
      ordersApi
        .getOrder(order.id)
        .then(setOrder)
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [order.id, order.status]);

  useEffect(() => {
    if (
      order.status === "AWAITING_PAYMENT" ||
      TERMINAL_ORDER_STATUSES.includes(order.status)
    ) {
      return;
    }
    ordersApi
      .getOrderQr(order.id)
      .then((r) => setQrCodeDataUrl(r.qrCodeDataUrl))
      .catch(() => {});
  }, [order.id, order.status]);

  if (order.status === "AWAITING_PAYMENT") {
    return <AwaitingPaymentView order={order} />;
  }

  if (FAILED_ORDER_STATUSES.includes(order.status)) {
    return <FailedOrderView order={order} />;
  }

  const currency = order.currency;
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const canCancel = canCancelOrder(order.status);
  const canTrack = isOrderTrackable(order.status, order.fulfillmentMethod);
  const trackUnavailableMessage = getTrackOrderUnavailableMessage(
    order.status,
    order.fulfillmentMethod,
  );
  const cancelUnavailableMessage = getCancelUnavailableMessage(order.status);
  const reference = formatOrderReference(order.id);

  async function handleCopyReference() {
    try {
      await navigator.clipboard.writeText(order.id);
      toast.success("Référence copiée.");
    } catch {
      toast.error("Impossible de copier la référence.");
    }
  }

  async function handleCancelConfirm() {
    if (!canCancel || isCancelling) return;
    setIsCancelling(true);
    try {
      const updated = await ordersApi.cancelOrder(
        order.id,
        "Annulée par l'acheteur.",
      );
      setOrder(updated);
      setCancelDialogOpen(false);
      toast.success("Commande annulée.");
    } catch (err) {
      toast.error(
        err instanceof ApiException
          ? err.message
          : "Impossible d'annuler la commande.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  function handleTrackClick() {
    if (canTrack) {
      router.push(`/orders/${order.id}/track`);
      return;
    }
    setTrackDialogOpen(true);
  }

  function handleCancelClick() {
    if (canCancel) {
      setCancelDialogOpen(true);
      return;
    }
    setCancelUnavailableDialogOpen(true);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-6 gap-2 text-muted-foreground hover:text-foreground"
        render={<Link href="/orders" />}
        nativeButton={false}
      >
        <ArrowLeft className="h-4 w-4" />
        Mes commandes
      </Button>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-linear-to-br from-primary/5 via-background to-background p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Commande #{reference}
              </h1>
              <Badge variant={orderStatusBadgeVariant(order.status)}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatOrderDate(order.createdAt)}
              {order.shop && (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    href={`/shops/${order.shop.slug}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {order.shop.name}
                  </Link>
                </>
              )}
            </p>
            <button
              type="button"
              onClick={handleCopyReference}
              className="inline-flex w-fit items-center gap-1.5 rounded-md px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
              Copier la référence complète
            </button>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total
            </p>
            <p className="text-2xl font-bold text-foreground">
              {formatOrderPrice(Number(order.total), currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {itemCount} article{itemCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Suivi de commande</CardTitle>
              <CardDescription>
                {order.fulfillmentMethod === "DELIVERY"
                  ? "Livraison à domicile"
                  : "Retrait en boutique"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <OrderStatusTimeline
                status={order.status}
                fulfillmentMethod={order.fulfillmentMethod}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Articles</CardTitle>
              <CardDescription>
                {itemCount} article{itemCount > 1 ? "s" : ""} commandé
                {itemCount > 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.productName}
                    </p>
                    {item.variantName && (
                      <p className="truncate text-xs text-muted-foreground">
                        {item.variantName}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatOrderPrice(Number(item.unitPrice), currency)} ×{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-foreground">
                    {formatOrderPrice(Number(item.subtotal), currency)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Détails</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
              <DetailRow
                icon={order.fulfillmentMethod === "DELIVERY" ? Truck : Store}
                label="Mode de réception"
                value={
                  order.fulfillmentMethod === "DELIVERY"
                    ? "Livraison"
                    : "Retrait en boutique"
                }
              />
              <DetailRow
                icon={
                  order.paymentMethod === "ONLINE_PAYMENT"
                    ? Smartphone
                    : Banknote
                }
                label="Paiement"
                value={
                  order.paymentMethod === "CASH_ON_DELIVERY"
                    ? "À la livraison"
                    : "Mobile Money"
                }
              />
              {order.deliveryAddress && (
                <DetailRow
                  icon={MapPin}
                  label="Adresse de livraison"
                  value={order.deliveryAddress}
                  className="sm:col-span-2"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          {qrCodeDataUrl && (
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30 text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <QrCodeIcon className="h-4 w-4" />
                  Code de remise
                </CardTitle>
                <CardDescription>
                  {order.fulfillmentMethod === "DELIVERY"
                    ? "Présentez ce code au livreur"
                    : "Présentez ce code en boutique"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 pt-6">
                <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
                  <Image
                    src={qrCodeDataUrl}
                    alt="QR code de commande"
                    width={200}
                    height={200}
                    className="size-50"
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Référence #{reference}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="text-foreground">
                  {formatOrderPrice(Number(order.subtotal), currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Livraison</span>
                <span className="text-foreground">
                  {Number(order.deliveryFee) > 0
                    ? formatOrderPrice(Number(order.deliveryFee), currency)
                    : "Gratuite"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">
                  {formatOrderPrice(Number(order.total), currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          {order.status === "COMPLETED" && (
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-foreground">
                Commande terminée avec succès. Merci pour votre achat !
              </p>
            </div>
          )}

          {order.fulfillmentMethod === "DELIVERY" && (
            <Button type="button" className="gap-2" onClick={handleTrackClick}>
              <Navigation className="h-4 w-4" />
              Suivre la commande
            </Button>
          )}

          {canTrack && (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setChatOpen(true)}
            >
              <MessageCircle className="h-4 w-4" />
              Message au livreur
            </Button>
          )}

          {!FAILED_ORDER_STATUSES.includes(order.status) &&
            order.status !== "COMPLETED" && (
              <Button
                type="button"
                variant="outline"
                className={
                  canCancel
                    ? "text-destructive hover:bg-destructive/5 hover:text-destructive"
                    : undefined
                }
                disabled={isCancelling}
                onClick={handleCancelClick}
              >
                Annuler la commande
              </Button>
            )}

          {order.shop && (
            <Button
              variant="outline"
              render={<Link href={`/shops/${order.shop.slug}`} />}
              nativeButton={false}
            >
              Continuer mes achats
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Navigation className="text-muted-foreground" />
            </AlertDialogMedia>
            <AlertDialogTitle>Suivi indisponible</AlertDialogTitle>
            <AlertDialogDescription>
              {trackUnavailableMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setTrackDialogOpen(false)}>
              Compris
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <XCircle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Annuler cette commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive.{" "}
              {order.paymentMethod === "ONLINE_PAYMENT"
                ? "Si vous avez déjà payé en ligne, le remboursement sera initié automatiquement."
                : "Aucun paiement en ligne n'a été effectué."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Retour
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isCancelling}
              onClick={handleCancelConfirm}
            >
              {isCancelling ? "Annulation..." : "Confirmer l'annulation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={cancelUnavailableDialogOpen}
        onOpenChange={setCancelUnavailableDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <XCircle className="text-muted-foreground" />
            </AlertDialogMedia>
            <AlertDialogTitle>Annulation impossible</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelUnavailableMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setCancelUnavailableDialogOpen(false)}
            >
              Compris
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OrderChat
        orderId={order.id}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </main>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
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

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-7 w-7 text-destructive" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-foreground">
            Commande introuvable
          </p>
          <p className="text-sm text-muted-foreground">
            {error ?? "Cette commande n'existe pas ou vous n'y avez pas accès."}
          </p>
        </div>
        <Button
          render={<Link href="/orders" />}
          nativeButton={false}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à mes commandes
        </Button>
      </div>
    );
  }

  return <OrderDetailContent order={order} />;
}
