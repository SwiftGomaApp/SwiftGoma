"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import * as BasePhoneInput from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import {
  MapPin,
  Loader2,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Smartphone,
  Truck,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CountrySelect, DEFAULT_COUNTRY } from "@/components/ui/country-select";
import { StateSelect } from "@/components/ui/state-select";
import { CitySelect } from "@/components/ui/city-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { useCart } from "@/providers/cart-provider";
import { useAuth } from "@/providers/auth-provider";
import { useSocket } from "@/providers/socket-provider";
import { cartApi, type Cart } from "@/lib/api/routes/cart";
import {
  ordersApi,
  type Order,
  type OrderStatus,
} from "@/lib/api/routes/orders";
import { ApiException } from "@/lib/api";
import { toast } from "@/lib/toast";

const BRAND_NAVY = "#FF4F00";
const BRAND_NAVY_HOVER = "#243350";
const BRAND_NAVY_SOFT = "#1C2742";

const NAVY_ACCENT_VARS = {
  "--primary": BRAND_NAVY,
  "--ring": BRAND_NAVY,
} as React.CSSProperties;

const NETWORKS = [
  { value: "vodacom", label: "Vodacom M-Pesa" },
  { value: "airtel", label: "Airtel Money" },
  { value: "orange", label: "Orange Money" },
  { value: "africell", label: "Africell Money" },
];

const CHECKOUT_CURRENCIES = [
  { value: "USD" as const, label: "Dollar (USD)" },
  { value: "CDF" as const, label: "Franc congolais (CDF)" },
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

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
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
  const contextCart = getCart(shopId);

  const [checkoutCurrency, setCheckoutCurrency] = useState<"USD" | "CDF">(
    () =>
      (user?.preferredCurrency ?? contextCart?.cartCurrency ?? "USD") as
        | "USD"
        | "CDF",
  );
  const [hasAppliedPreferredCurrency, setHasAppliedPreferredCurrency] =
    useState(Boolean(user?.preferredCurrency));
  const [cart, setCart] = useState<Cart | null>(contextCart ?? null);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const [fulfillmentMethod, setFulfillmentMethod] = useState<
    "DELIVERY" | "PICKUP"
  >("DELIVERY");

  // Address fields — laid out like the billing-details mock. These are only
  // ever combined into the single `deliveryAddress` string the API already
  // expects, so the checkout payload shape hasn't changed.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] =
    useState<BasePhoneInput.Country>(DEFAULT_COUNTRY);
  const [streetAddress, setStreetAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");

  // Country changed → the previously selected province/city no longer
  // apply. Province changed → the previously selected city no longer
  // applies either (it was scoped to the old province's city list).
  useEffect(() => {
    setStateCode("");
    setStateName("");
    setCity("");
  }, [country]);
  useEffect(() => {
    setCity("");
  }, [stateCode]);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [isLocating, setIsLocating] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<
    "CASH_ON_DELIVERY" | "ONLINE_PAYMENT"
  >("CASH_ON_DELIVERY");
  const [payerPhoneNumber, setPayerPhoneNumber] = useState(user?.phone ?? "");
  const [network, setNetwork] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step, setStep] = useState<Step>("form");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user?.preferredCurrency && !hasAppliedPreferredCurrency) {
      setCheckoutCurrency(user.preferredCurrency as "USD" | "CDF");
      setHasAppliedPreferredCurrency(true);
    }
  }, [user?.preferredCurrency, hasAppliedPreferredCurrency]);

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    setIsLoadingCart(true);
    setConversionError(null);

    cartApi
      .getCartForShop(shopId, checkoutCurrency)
      .then((fresh) => {
        if (cancelled) return;
        setCart(fresh);
        const unavailable = fresh.items.filter(
          (item) => item.conversionUnavailable,
        );
        if (unavailable.length > 0) {
          setConversionError(
            `Taux de change indisponible pour convertir certains articles en ${checkoutCurrency}.`,
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setConversionError(
          err instanceof ApiException
            ? err.message
            : "Impossible de convertir les prix dans cette devise.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCart(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shopId, checkoutCurrency]);

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

  if (!isMounted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
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

  const currency = cart.cartCurrency ?? checkoutCurrency;
  const itemsTotal = cart.items.reduce(
    (sum, i) => sum + (i.displayPrice ?? Number(i.variant.price)) * i.quantity,
    0,
  );
  const deliveryFee =
    fulfillmentMethod === "DELIVERY"
      ? (cart.displayDeliveryFee ??
        (cart.shop ? Number(cart.shop.deliveryFee) : 0))
      : 0;
  const grandTotal = itemsTotal + deliveryFee;
  const hasConversionIssues =
    !!conversionError || cart.items.some((item) => item.conversionUnavailable);

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

  // Combines the billing-details-style fields into the single address
  // string the checkout API accepts, so nothing downstream of submit
  // needs to change.
  function buildDeliveryAddress() {
    const recipient = `${firstName.trim()} ${lastName.trim()}`.trim();
    const line1 = apartment.trim()
      ? `${streetAddress.trim()}, ${apartment.trim()}`
      : streetAddress.trim();
    const cityLine = [city.trim(), stateName.trim(), zipCode.trim()]
      .filter(Boolean)
      .join(", ");
    const countryLabel = (en as Record<string, string>)[country] ?? country;

    return [
      recipient,
      line1,
      cityLine,
      countryLabel,
      phone.trim() && `Tél: ${phone.trim()}`,
    ]
      .filter(Boolean)
      .join(" — ");
  }

  const requiredDeliveryFieldsFilled =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    BasePhoneInput.isValidPhoneNumber(phone || "") &&
    streetAddress.trim().length > 0 &&
    city.trim().length > 0 &&
    zipCode.trim().length > 0 &&
    !!country;

  const isDeliveryValid =
    fulfillmentMethod === "PICKUP" ||
    (requiredDeliveryFieldsFilled && coords !== null);
  const isPaymentValid =
    paymentMethod === "CASH_ON_DELIVERY" ||
    (BasePhoneInput.isValidPhoneNumber(payerPhoneNumber || "") && !!network);
  const canSubmit =
    isDeliveryValid &&
    isPaymentValid &&
    !isSubmitting &&
    !hasConversionIssues &&
    !isLoadingCart;

  const submitBlockers: string[] = [];
  if (fulfillmentMethod === "DELIVERY") {
    if (!requiredDeliveryFieldsFilled) {
      submitBlockers.push(
        "Coordonnées de livraison (nom, email, téléphone, adresse, ville, code postal, pays)",
      );
    }
    if (!coords) {
      submitBlockers.push(
        "Position GPS — cliquez sur « Utiliser ma position »",
      );
    }
  }
  if (hasConversionIssues && conversionError) {
    submitBlockers.push(conversionError);
  } else if (hasConversionIssues) {
    submitBlockers.push(
      `Conversion en ${currency} indisponible pour certains articles`,
    );
  }
  if (paymentMethod === "ONLINE_PAYMENT") {
    if (!BasePhoneInput.isValidPhoneNumber(payerPhoneNumber || "")) {
      submitBlockers.push("Numéro Mobile Money valide");
    }
    if (!network) {
      submitBlockers.push("Opérateur Mobile Money");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const result = await ordersApi.checkout({
        shopId,
        paymentMethod,
        fulfillmentMethod,
        currency: checkoutCurrency,
        ...(fulfillmentMethod === "DELIVERY" && {
          deliveryAddress: buildDeliveryAddress(),
          deliveryLatitude: coords!.lat,
          deliveryLongitude: coords!.lng,
        }),
        ...(paymentMethod === "ONLINE_PAYMENT" && {
          payerPhoneNumber: payerPhoneNumber.trim(),
          network: network,
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
        {/* Left column — order summary + fulfillment + address */}
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
                      {item.originalPrice != null &&
                        item.originalCurrency &&
                        item.originalCurrency !== currency && (
                          <>
                            {" "}
                            ·{" "}
                            {formatPrice(
                              item.originalPrice * item.quantity,
                              item.originalCurrency,
                            )}
                          </>
                        )}
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

          <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Mode de réception
            </h2>
            <RadioGroup
              value={fulfillmentMethod}
              onValueChange={(v) =>
                setFulfillmentMethod(v as "DELIVERY" | "PICKUP")
              }
              className="grid-cols-1 sm:grid-cols-2"
              style={NAVY_ACCENT_VARS}
            >
              <label
                className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm text-foreground transition-colors"
                style={
                  fulfillmentMethod === "DELIVERY"
                    ? {
                        borderColor: BRAND_NAVY,
                        backgroundColor: `${BRAND_NAVY_SOFT}0D`,
                      }
                    : undefined
                }
              >
                <RadioGroupItem value="DELIVERY" />
                <Truck className="h-4 w-4 text-muted-foreground" />
                Livraison
              </label>
              <label
                className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm text-foreground transition-colors"
                style={
                  fulfillmentMethod === "PICKUP"
                    ? {
                        borderColor: BRAND_NAVY,
                        backgroundColor: `${BRAND_NAVY_SOFT}0D`,
                      }
                    : undefined
                }
              >
                <RadioGroupItem value="PICKUP" />
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                Retrait en boutique
              </label>
            </RadioGroup>

            {fulfillmentMethod === "DELIVERY" && (
              <div className="mt-1 flex flex-col gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Coordonnées de livraison
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required>Prénom</FieldLabel>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required>Nom</FieldLabel>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required>Email</FieldLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Entreprise (facultatif)</FieldLabel>
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Nom de l'entreprise"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel required>Pays / Région</FieldLabel>
                  <CountrySelect value={country} onChange={setCountry} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel required>Adresse</FieldLabel>
                  <Input
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Numéro et nom de l'avenue"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>
                    Appartement, quartier, référence (facultatif)
                  </FieldLabel>
                  <Input
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="Appartement, quartier, point de repère…"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Province / État</FieldLabel>
                    <StateSelect
                      countryCode={country}
                      value={stateCode}
                      onChange={(state) => {
                        setStateCode(state?.isoCode ?? "");
                        setStateName(state?.name ?? "");
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required>Ville</FieldLabel>
                    <CitySelect
                      countryCode={country}
                      stateCode={stateCode}
                      value={city}
                      onChange={(cityName) => setCity(cityName ?? "")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required>Code postal</FieldLabel>
                    <Input
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="Code postal"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel required>Téléphone</FieldLabel>
                    <PhoneInput
                      value={phone as BasePhoneInput.Value}
                      onChange={(value) => setPhone(value)}
                      defaultCountry={DEFAULT_COUNTRY}
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant={coords ? "outline" : "default"}
                  onClick={handleUseLocation}
                  disabled={isLocating}
                  className="w-fit gap-2"
                  style={
                    coords
                      ? undefined
                      : { backgroundColor: BRAND_NAVY, color: "white" }
                  }
                >
                  {isLocating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" />
                  )}
                  {coords
                    ? "Position enregistrée — modifier"
                    : isLocating
                      ? "Localisation..."
                      : "Utiliser ma position"}
                </Button>
                {!coords && !isLocating && (
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    Étape obligatoire : autorisez la géolocalisation pour que le
                    livreur puisse vous trouver. Sans position GPS, le bouton «
                    Commander » reste désactivé.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column — payment + totals */}
        <div className="flex flex-col gap-8 lg:sticky lg:top-24">
          <div className="flex flex-col gap-3 rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground">Devise</h2>
            <RadioGroup
              value={checkoutCurrency}
              onValueChange={(v) => setCheckoutCurrency(v as "USD" | "CDF")}
              className="grid-cols-2"
              disabled={isLoadingCart}
              style={NAVY_ACCENT_VARS}
            >
              {CHECKOUT_CURRENCIES.map((c) => (
                <label
                  key={c.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm text-foreground"
                >
                  <RadioGroupItem value={c.value} />
                  {c.label}
                </label>
              ))}
            </RadioGroup>
            {isLoadingCart && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Mise à jour des prix…
              </p>
            )}
            {conversionError && (
              <p className="text-xs text-destructive">{conversionError}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground">Paiement</h2>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) =>
                setPaymentMethod(v as "CASH_ON_DELIVERY" | "ONLINE_PAYMENT")
              }
              className="grid-cols-1"
              style={NAVY_ACCENT_VARS}
            >
              <label
                className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm text-foreground transition-colors"
                style={
                  paymentMethod === "CASH_ON_DELIVERY"
                    ? {
                        borderColor: BRAND_NAVY,
                        backgroundColor: `${BRAND_NAVY_SOFT}0D`,
                      }
                    : undefined
                }
              >
                <RadioGroupItem value="CASH_ON_DELIVERY" />
                Paiement à la livraison
              </label>
              <label
                className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm text-foreground transition-colors"
                style={
                  paymentMethod === "ONLINE_PAYMENT"
                    ? {
                        borderColor: BRAND_NAVY,
                        backgroundColor: `${BRAND_NAVY_SOFT}0D`,
                      }
                    : undefined
                }
              >
                <RadioGroupItem value="ONLINE_PAYMENT" />
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                Paiement en ligne (Mobile Money)
              </label>
            </RadioGroup>

            {paymentMethod === "ONLINE_PAYMENT" && (
              <div className="mt-2 flex flex-col gap-3">
                <PhoneInput
                  value={payerPhoneNumber as BasePhoneInput.Value}
                  onChange={(value) => setPayerPhoneNumber(value)}
                  defaultCountry={DEFAULT_COUNTRY}
                  placeholder="Numéro Mobile Money"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal"
                      >
                        <span
                          className={
                            network
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {network
                            ? NETWORKS.find((n) => n.value === network)?.label
                            : "Opérateur"}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Button>
                    }
                    nativeButton={false}
                  />
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {NETWORKS.map((n) => (
                      <DropdownMenuItem
                        key={n.value}
                        onClick={() => setNetwork(n.value)}
                      >
                        {n.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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

          {!canSubmit && submitBlockers.length > 0 && !isSubmitting && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Pour commander, complétez :</p>
              <ul className="mt-1 list-inside list-disc text-xs">
                {submitBlockers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            size="lg"
            style={canSubmit ? { backgroundColor: BRAND_NAVY } : undefined}
            className={canSubmit ? "text-white hover:opacity-90" : undefined}
            onMouseEnter={(e) => {
              if (canSubmit)
                e.currentTarget.style.backgroundColor = BRAND_NAVY_HOVER;
            }}
            onMouseLeave={(e) => {
              if (canSubmit) e.currentTarget.style.backgroundColor = BRAND_NAVY;
            }}
          >
            {isSubmitting
              ? "Envoi de la commande..."
              : isLoadingCart
                ? "Calcul des prix..."
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
