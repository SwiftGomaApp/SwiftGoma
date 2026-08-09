"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Loader2,
  ShoppingBag,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/providers/cart-provider";
import { useAuth } from "@/providers/auth-provider";
import { useSocket } from "@/providers/socket-provider";
import {
  ordersApi,
  type Order,
  type OrderStatus,
} from "@/lib/api/routes/orders";
import { ApiException } from "@/lib/api";
import { toast } from "@/lib/toast";

const NETWORKS = [
  { value: "vodacom", label: "Vodacom M-Pesa" },
  { value: "airtel", label: "Airtel Money" },
  { value: "orange", label: "Orange Money" },
  { value: "africell", label: "Africell Money" },
];

const FAILURE_STATUSES: OrderStatus[] = [
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "REJECTED",
];

type Step = "form" | "polling" | "success" | "failed";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currency === "CDF" ? 0 : 2,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(price);
}

function PollingView({
  order,
  canCancel,
  isCancelling,
  onCancel,
}: {
  order: Order;
  canCancel: boolean;
  isCancelling: boolean;
  onCancel: () => void;
}) {
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
      <p className="text-sm font-medium text-foreground">
        Total à payer — {formatPrice(Number(order.total), order.currency)}
      </p>

      {canCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isCancelling}
          className="mt-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
        >
          {isCancelling
            ? "Annulation..."
            : "Ça prend trop de temps ? Annuler la commande"}
        </button>
      )}
    </div>
  );
}

function SuccessView({
  order,
  router,
}: {
  order: Order;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
      <CheckCircle2 className="h-12 w-12 text-primary" />
      <h1 className="text-lg font-semibold text-foreground">
        Commande confirmée
      </h1>
      <p className="text-sm text-muted-foreground">
        Votre commande a été enregistrée
        {order.paymentMethod === "ONLINE_PAYMENT"
          ? " et le paiement a été confirmé."
          : "."}
      </p>
      <div className="flex w-full flex-col gap-2 rounded-xl border border-border p-5 text-sm">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span className="text-muted-foreground">
              {item.productName} × {item.quantity}
            </span>
            <span className="text-foreground">
              {formatPrice(Number(item.subtotal), order.currency)}
            </span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-border pt-3">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">
            {formatPrice(Number(order.total), order.currency)}
          </span>
        </div>
      </div>
      <div className="flex w-full gap-3">
        <Button
          variant="outline"
          className="flex-1"
          render={<Link href="/products" />}
          nativeButton={false}
        >
          Continuer mes achats
        </Button>
        <Button
          className="flex-1"
          onClick={() => router.push(`/orders/${order.id}`)}
        >
          Voir ma commande
        </Button>
      </div>
    </div>
  );
}

function FailedView({ order }: { order: Order }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-24 text-center">
      <XCircle className="h-10 w-10 text-destructive" />
      <h1 className="text-lg font-semibold text-foreground">
        Le paiement a échoué
      </h1>
      {order.failureReason && (
        <p className="text-sm text-muted-foreground">{order.failureReason}</p>
      )}
      <Button
        render={
          <Link href={order.shop ? `/shops/${order.shop.slug}` : "/products"} />
        }
        nativeButton={false}
      >
        Retour à la boutique
      </Button>
    </div>
  );
}

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId") ?? "";
  const { getCart, clearCartLocal } = useCart();
  const { user } = useAuth();
  const { socket } = useSocket();
  const cart = getCart(shopId);

  const [fulfillmentMethod, setFulfillmentMethod] = useState<
    "DELIVERY" | "PICKUP"
  >("DELIVERY");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH_ON_DELIVERY" | "ONLINE_PAYMENT"
  >("CASH_ON_DELIVERY");
  const [payerPhoneNumber, setPayerPhoneNumber] = useState(user?.phone ?? "");
  const [network, setNetwork] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step, setStep] = useState<Step>("form");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // The cart is only cleared once we know the order didn't land — or
  // didn't stay — in AWAITING_PAYMENT, so a failed/abandoned online
  // payment leaves the buyer's selection intact for an easy retry instead
  // of forcing them to re-browse and re-add everything.
  function resolveOrderStatus(status: OrderStatus) {
    if (status === "AWAITING_PAYMENT") return;
    if (FAILURE_STATUSES.includes(status)) {
      setStep("failed");
    } else {
      clearCartLocal(shopId);
      setStep("success");
    }
  }

  // Polling fallback while awaiting payment, in case the socket drops
  useEffect(() => {
    if (step !== "polling" || !placedOrder) return;
    const interval = setInterval(() => {
      ordersApi
        .getOrder(placedOrder.id)
        .then((o) => {
          setPlacedOrder(o);
          resolveOrderStatus(o.status);
        })
        .catch(() => {
          // transient error — next tick retries
        });
    }, 4000);
    return () => clearInterval(interval);
  }, [step, placedOrder?.id]);

  // Live status updates via socket
  useEffect(() => {
    if (!socket || step !== "polling" || !placedOrder) return;
    function onStatus(payload: { orderId: string; status: OrderStatus }) {
      if (payload.orderId !== placedOrder!.id) return;
      setPlacedOrder((prev) =>
        prev ? { ...prev, status: payload.status } : prev,
      );
      resolveOrderStatus(payload.status);
    }
    socket.on("order:status", onStatus);
    return () => {
      socket.off("order:status", onStatus);
    };
  }, [socket, step, placedOrder?.id]);

  // Offer a cancel option once the buyer has had a real chance to approve
  // the Mobile Money prompt on their phone, rather than tempting an
  // instant cancel the moment polling starts. canCancel is reset back to
  // false explicitly at each place `step` leaves "polling" (below), not
  // here, so this effect only ever sets state from the timer callback.
  useEffect(() => {
    if (step !== "polling") return;
    const timeout = setTimeout(() => setCanCancel(true), 20000);
    return () => clearTimeout(timeout);
  }, [step, placedOrder?.id]);

  async function handleCancelOrder() {
    if (!placedOrder) return;
    setIsCancelling(true);
    try {
      await ordersApi.cancelOrder(
        placedOrder.id,
        "Annulée par l'acheteur pendant l'attente du paiement.",
      );
      toast.success("Commande annulée.");
      setStep("form");
      setPlacedOrder(null);
      setCanCancel(false);
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

  if (step === "polling" && placedOrder) {
    return (
      <PollingView
        order={placedOrder}
        canCancel={canCancel}
        isCancelling={isCancelling}
        onCancel={handleCancelOrder}
      />
    );
  }
  if (step === "success" && placedOrder) {
    return <SuccessView order={placedOrder} router={router} />;
  }
  if (step === "failed" && placedOrder) {
    return <FailedView order={placedOrder} />;
  }

  if (!shopId || !cart || cart.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Votre panier est vide
        </p>
        <p className="text-sm text-muted-foreground">
          Ajoutez des produits avant de passer commande.
        </p>
        <Button render={<Link href="/products" />} nativeButton={false}>
          Découvrir les produits
        </Button>
      </div>
    );
  }

  const currency = cart.cartCurrency ?? "USD";
  const itemsTotal = cart.items.reduce(
    (sum, i) => sum + (i.displayPrice ?? Number(i.variant.price)) * i.quantity,
    0,
  );
  const deliveryFee =
    fulfillmentMethod === "DELIVERY" && cart.shop
      ? Number(cart.shop.deliveryFee)
      : 0;
  const grandTotal = itemsTotal + deliveryFee;

  function handleUseLocation() {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        toast.success("Position enregistrée.");
      },
      (err) => {
        setIsLocating(false);
        console.error("[geolocation] failed:", err.code, err.message);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(
            "Autorisation de localisation refusée. Autorisez-la dans les paramètres de votre navigateur.",
          );
        } else if (err.code === err.TIMEOUT) {
          toast.error("La localisation a pris trop de temps. Réessayez.");
        } else {
          toast.error(
            "Position indisponible. Sur Mac, vérifiez que les Services de localisation sont activés pour votre navigateur dans Réglages Système > Confidentialité et sécurité > Service de localisation.",
          );
        }
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  const isDeliveryValid =
    fulfillmentMethod === "PICKUP" ||
    (deliveryAddress.trim().length >= 10 && coords !== null);
  const isPaymentValid =
    paymentMethod === "CASH_ON_DELIVERY" ||
    (payerPhoneNumber.trim().length >= 9 && !!network);
  const canSubmit = isDeliveryValid && isPaymentValid && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const result = await ordersApi.checkout({
        shopId,
        paymentMethod,
        fulfillmentMethod,
        ...(fulfillmentMethod === "DELIVERY" && {
          deliveryAddress: deliveryAddress.trim(),
          deliveryLatitude: coords!.lat,
          deliveryLongitude: coords!.lng,
        }),
        ...(paymentMethod === "ONLINE_PAYMENT" && {
          payerPhoneNumber: payerPhoneNumber.trim(),
          network: network!,
          countryCode: "CD",
        }),
      });
      setPlacedOrder(result.order);
      if (result.order.status === "AWAITING_PAYMENT") {
        setStep("polling");
      } else {
        clearCartLocal(shopId);
        setStep("success");
      }
    } catch (err) {
      toast.error(
        err instanceof ApiException
          ? err.message
          : "Impossible de finaliser la commande.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Finaliser la commande
      </h1>
      {cart.shop && (
        <p className="mt-1 text-sm text-muted-foreground">{cart.shop.name}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_380px]"
      >
        {/* Left column — order summary + fulfillment */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3 rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground">Articles</h2>
            <div className="flex flex-col divide-y divide-border">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.variant.product.images?.[0] && (
                      <Image
                        src={item.variant.product.images[0].url}
                        alt={item.variant.product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.variant.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qté {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatPrice(
                      (item.displayPrice ?? Number(item.variant.price)) *
                        item.quantity,
                      currency,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Mode de réception
            </h2>
            <RadioGroup
              value={fulfillmentMethod}
              onValueChange={(v) =>
                setFulfillmentMethod(v as "DELIVERY" | "PICKUP")
              }
              className="grid-cols-1 sm:grid-cols-2"
            >
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm text-foreground">
                <RadioGroupItem value="DELIVERY" />
                Livraison
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm text-foreground">
                <RadioGroupItem value="PICKUP" />
                Retrait en boutique
              </label>
            </RadioGroup>

            {fulfillmentMethod === "DELIVERY" && (
              <div className="mt-2 flex flex-col gap-3">
                <Textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Adresse de livraison complète (quartier, avenue, référence...)"
                  rows={3}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseLocation}
                  disabled={isLocating}
                  className="w-fit gap-2"
                >
                  {isLocating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" />
                  )}
                  {coords
                    ? "Position enregistrée"
                    : isLocating
                      ? "Localisation..."
                      : "Utiliser ma position"}
                </Button>
                {!coords && !isLocating && (
                  <p className="text-xs text-muted-foreground">
                    Votre position est requise pour la livraison — cliquez sur «
                    Utiliser ma position » ci-dessus pour continuer.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column — payment + totals */}
        <div className="flex flex-col gap-8 lg:sticky lg:top-24">
          <div className="flex flex-col gap-3 rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground">Paiement</h2>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) =>
                setPaymentMethod(v as "CASH_ON_DELIVERY" | "ONLINE_PAYMENT")
              }
              className="grid-cols-1"
            >
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm text-foreground">
                <RadioGroupItem value="CASH_ON_DELIVERY" />
                Paiement à la livraison
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm text-foreground">
                <RadioGroupItem value="ONLINE_PAYMENT" />
                Paiement en ligne (Mobile Money)
              </label>
            </RadioGroup>

            {paymentMethod === "ONLINE_PAYMENT" && (
              <div className="mt-2 flex flex-col gap-3">
                <Input
                  value={payerPhoneNumber}
                  onChange={(e) => setPayerPhoneNumber(e.target.value)}
                  placeholder="Numéro Mobile Money"
                  required
                />
                <Select value={network} onValueChange={setNetwork}>
                  <SelectTrigger>
                    <SelectValue placeholder="Opérateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {NETWORKS.map((n) => (
                      <SelectItem key={n.value} value={n.value}>
                        {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isPaymentValid && (
                  <p className="text-xs text-muted-foreground">
                    Saisissez votre numéro et choisissez un opérateur pour
                    continuer.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="text-foreground">
                {formatPrice(itemsTotal, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Livraison</span>
              <span className="text-foreground">
                {formatPrice(deliveryFee, currency)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <span className="text-base font-semibold text-foreground">
                Total
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatPrice(grandTotal, currency)}
              </span>
            </div>
          </div>

          <Button type="submit" disabled={!canSubmit} size="lg">
            {isSubmitting
              ? "Envoi de la commande..."
              : `Commander — ${formatPrice(grandTotal, currency)}`}
          </Button>
        </div>
      </form>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutForm />
    </Suspense>
  );
}
