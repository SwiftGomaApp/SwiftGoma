"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Loader2,
  MapPin,
  Smartphone,
  Store,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AfricellLogo } from "@/components/checkout/africell-logo";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { isApiError } from "@/lib/api/client";
import {
  createAddress,
  listAddresses,
  type Address,
} from "@/lib/api/routes/addresses.routes";
import { getCartForShop, type ShopCart } from "@/lib/api/routes/cart.routes";
import {
  MOBILE_MONEY_NETWORKS,
  checkout,
  getOrder,
  type MobileMoneyNetwork,
  type Order,
} from "@/lib/api/routes/orders.routes";
import { useAuth } from "@/lib/auth/auth-context";
import { useCart } from "@/lib/cart/cart-context";
import { PRODUCT_CURRENCIES } from "@/lib/constants/products";
import type { Locale } from "@/lib/language";
import { formatMoney } from "@/lib/products";
import { cn } from "@/lib/utils";

const NETWORK_LABELS: Record<MobileMoneyNetwork, string> = {
  vodacom: "M-Pesa",
  airtel: "Airtel Money",
  orange: "Orange Money",
  africell: "Afril Money",
};

// Africell doesn't have a hosted logo image — it renders from a local SVG
// wordmark (AfricellLogo) instead, since pawaPay doesn't host one.
const NETWORK_LOGOS: Record<Exclude<MobileMoneyNetwork, "africell">, string> = {
  vodacom: "https://static-content.pawapay.io/provider_logos/vodacom.png",
  airtel: "https://static-content.pawapay.io/provider_logos/airtel.png",
  orange: "https://static-content.pawapay.io/provider_logos/orange.png",
};

const NETWORK_PREFIXES: Record<MobileMoneyNetwork, string[]> = {
  vodacom: ["081", "082", "083"],
  airtel: ["097", "098", "099"],
  orange: ["080", "084", "085", "089"],
  africell: ["090", "091"],
};

function detectNetwork(phone: string): MobileMoneyNetwork | null {
  const digits = phone.replace(/\D/g, "");
  // accepts +243XXXXXXXXX, 243XXXXXXXXX, or 0XXXXXXXXX
  const local = digits.startsWith("243")
    ? "0" + digits.slice(3)
    : digits.startsWith("0")
      ? digits
      : "0" + digits;
  const prefix = local.slice(0, 3);

  for (const [net, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix)) return net as MobileMoneyNetwork;
  }
  return null;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes

const STRINGS = {
  en: {
    back: "Back to cart",
    orderSummary: "Order summary",
    currency: "Currency",
    subtotal: "Subtotal",
    deliveryFee: "Delivery fee",
    total: "Total",
    checkoutTitle: "Checkout",
    fulfillment: "Fulfillment",
    pickup: "Pickup",
    delivery: "Delivery",
    deliveryAddress: "Delivery address",
    addressReference: "Reference",
    deliveryAddressPlaceholder:
      "A landmark or place known in the area (market, church, blue gate…)",
    addressLabel: "Label",
    addressLabelPlaceholder: "Home, Work…",
    recipientName: "Recipient name",
    recipientPhone: "Recipient phone",
    city: "City / commune",
    locating: "Locating you…",
    locationCaptured: "Location captured",
    locationError:
      "Couldn't get your location. Allow location access and try again.",
    retryLocation: "Retry",
    defaultBadge: "Default",
    useSavedAddress: "Use a saved address",
    addNewAddress: "Add a new address",
    saveAddressForLater: "Save this address for later",
    selectAddressError: "Select a delivery address.",
    loadingAddresses: "Loading your addresses…",
    paymentMethod: "Payment method",
    mobileMoney: "Mobile Money",
    cashOnDelivery: "Cash on Delivery",
    codDescription: "Pay in cash when your order arrives.",
    card: "Card",
    comingSoon: "Coming soon",
    network: "Network",
    phoneNumber: "Phone number",
    pay: "Pay",
    payAmount: (amount: string) => `Pay ${amount}`,
    placeOrder: "Place order",
    submitting: "Processing…",
    terms: "By continuing, you agree to be charged the total shown above.",
    codTerms: "You'll pay the total shown above in cash on delivery.",
    emptyTitle: "This cart is empty",
    emptyDescription: "Add something to your cart before checking out.",
    browseProducts: "Browse products",
    pollingTitle: "Confirming your payment",
    pollingDescription:
      "Check your phone for the mobile money prompt and approve it. This can take a moment.",
    pollingTimeoutTitle: "Still processing",
    pollingTimeoutDescription:
      "This is taking longer than usual. We'll keep your order — you can check its status again in a moment.",
    checkAgain: "Check again",
    successTitle: "Payment successful",
    successDescription:
      "Your order has been placed and the seller has been notified.",
    orderNumber: "Order",
    continueShopping: "Continue shopping",
    errorTitle: "Payment failed",
    tryAgain: "Try again",
    contactSupport: "Contact support",
    formErrorTitle: "Couldn't start checkout",
    genericError: "Something went wrong. Please try again.",
    selectNetworkError: "Select a mobile money network.",
    phoneNumberError: "Enter a valid phone number.",
    addressError: "Enter a delivery address.",
    locationRequiredError:
      "We need your location for delivery — allow access and retry.",
  },
  fr: {
    back: "Retour au panier",
    orderSummary: "Récapitulatif",
    currency: "Devise",
    subtotal: "Sous-total",
    deliveryFee: "Frais de livraison",
    total: "Total",
    checkoutTitle: "Paiement",
    fulfillment: "Mode de réception",
    pickup: "Retrait",
    delivery: "Livraison",
    deliveryAddress: "Adresse de livraison",
    addressReference: "Reference",
    deliveryAddressPlaceholder:
      "Un repère connu dans le quartier (marché, église, portail bleu…)",
    addressLabel: "Nom",
    addressLabelPlaceholder: "Domicile, Travail…",
    recipientName: "Nom du destinataire",
    recipientPhone: "Téléphone du destinataire",
    city: "Ville / commune",
    locating: "Localisation en cours…",
    locationCaptured: "Position enregistrée",
    locationError:
      "Impossible d'obtenir votre position. Autorisez la localisation et réessayez.",
    retryLocation: "Réessayer",
    defaultBadge: "Par défaut",
    useSavedAddress: "Utiliser une adresse enregistrée",
    addNewAddress: "Ajouter une nouvelle adresse",
    saveAddressForLater: "Enregistrer cette adresse pour plus tard",
    selectAddressError: "Sélectionnez une adresse de livraison.",
    loadingAddresses: "Chargement de vos adresses…",
    paymentMethod: "Moyen de paiement",
    mobileMoney: "Mobile Money",
    cashOnDelivery: "Paiement à la livraison",
    codDescription: "Payez en espèces à la réception de votre commande.",
    card: "Carte",
    comingSoon: "Bientôt disponible",
    network: "Réseau",
    phoneNumber: "Numéro de téléphone",
    pay: "Payer",
    payAmount: (amount: string) => `Payer ${amount}`,
    placeOrder: "Passer la commande",
    submitting: "Traitement…",
    terms:
      "En continuant, vous acceptez d'être facturé du total indiqué ci-dessus.",
    codTerms:
      "Vous paierez le total indiqué ci-dessus en espèces à la livraison.",
    emptyTitle: "Ce panier est vide",
    emptyDescription: "Ajoutez un article à votre panier avant de payer.",
    browseProducts: "Parcourir les produits",
    pollingTitle: "Confirmation du paiement",
    pollingDescription:
      "Vérifiez votre téléphone pour la demande mobile money et approuvez-la. Cela peut prendre un instant.",
    pollingTimeoutTitle: "Traitement en cours",
    pollingTimeoutDescription:
      "Cela prend plus de temps que prévu. Votre commande est conservée — vérifiez à nouveau son statut dans un instant.",
    checkAgain: "Vérifier à nouveau",
    successTitle: "Paiement réussi",
    successDescription:
      "Votre commande a été passée et le vendeur a été notifié.",
    orderNumber: "Commande",
    continueShopping: "Continuer mes achats",
    errorTitle: "Échec du paiement",
    tryAgain: "Réessayer",
    contactSupport: "Contacter le support",
    formErrorTitle: "Impossible de lancer le paiement",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    selectNetworkError: "Choisissez un réseau mobile money.",
    phoneNumberError: "Saisissez un numéro de téléphone valide.",
    addressError: "Saisissez une adresse de livraison.",
    locationRequiredError:
      "Nous avons besoin de votre position pour la livraison — autorisez l'accès et réessayez.",
  },
} as const;

type Phase = "loading" | "empty" | "form" | "polling" | "success" | "error";

function extractMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}

export function CheckoutView({
  shopId,
  locale,
}: {
  shopId: string;
  locale: Locale;
}) {
  const t = STRINGS[locale];
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { refresh: refreshCart } = useCart();

  const [phase, setPhase] = useState<Phase>("loading");
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [currency, setCurrency] = useState<string>("");

  const [fulfillmentMethod, setFulfillmentMethod] = useState<
    "PICKUP" | "DELIVERY"
  >("PICKUP");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [newAddressLabel, setNewAddressLabel] = useState("");
  const [newAddressRecipientName, setNewAddressRecipientName] = useState("");
  const [newAddressRecipientPhone, setNewAddressRecipientPhone] = useState("");
  const [newAddressCity, setNewAddressCity] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<Address[] | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"saved" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  const [paymentTab, setPaymentTab] = useState<"mobile" | "cod" | "card">(
    "mobile",
  );
  const [network, setNetwork] = useState<MobileMoneyNetwork | "">("");
  const [brokenLogos, setBrokenLogos] = useState<Set<MobileMoneyNetwork>>(
    new Set(),
  );
  const [phoneNumber, setPhoneNumber] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollAttempts = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCart = useCallback(
    async (
      requestedCurrency?: string,
      deliveryLatitude?: number,
      deliveryLongitude?: number,
    ) => {
      try {
        const result = await getCartForShop(
          shopId,
          requestedCurrency,
          deliveryLatitude,
          deliveryLongitude,
        );
        setCart(result);
        setCurrency(result.cartCurrency ?? requestedCurrency ?? "");
        setPhase(result.items.length === 0 ? "empty" : "form");
      } catch (err) {
        if (isApiError(err) && err.response?.status === 401) {
          router.push(`/auth/sign-in?redirect=/checkout/${shopId}`);
          return;
        }
        setPhase("empty");
      }
    },
    [shopId, router],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/auth/sign-in?redirect=/checkout/${shopId}`);
      return;
    }
    loadCart();

    listAddresses()
      .then((list) => {
        setSavedAddresses(list);
        const preferred = list.find((a) => a.isDefault) ?? list[0] ?? null;
        if (preferred) setSelectedAddressId(preferred.id);
        setDeliveryMode(list.length > 0 ? "saved" : "new");
      })
      .catch(() => {
        setSavedAddresses([]);
        setDeliveryMode("new");
      });
  }, [authLoading, isAuthenticated, loadCart, router, shopId]);

  function handleCurrencyChange(nextCurrency: string) {
    setCurrency(nextCurrency);
    loadCart(nextCurrency, effectiveDeliveryLat, effectiveDeliveryLng);
  }

  function switchToNewAddress() {
    setDeliveryMode("new");
    if (!coords) requestLocation();
  }

  function switchToSavedAddress() {
    setDeliveryMode("saved");
    setLocationError(null);
  }

  function requestLocation() {
    setLocationError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError(t.locationError);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setLocationError(t.locationError);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleFulfillmentChange(value: "PICKUP" | "DELIVERY") {
    setFulfillmentMethod(value);
    if (value === "DELIVERY" && !coords) {
      requestLocation();
    }
  }

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const pollOrder = useCallback(
    async (orderId: string) => {
      try {
        const updated = await getOrder(orderId);
        setOrder(updated);

        if (updated.payment?.status === "SUCCEEDED") {
          setPhase("success");
          refreshCart();
          return;
        }
        if (
          updated.payment?.status === "FAILED" ||
          updated.status === "FAILED"
        ) {
          setPhase("error");
          return;
        }

        pollAttempts.current += 1;
        if (pollAttempts.current >= MAX_POLL_ATTEMPTS) {
          setPollTimedOut(true);
          return;
        }
        pollTimer.current = setTimeout(
          () => pollOrder(orderId),
          POLL_INTERVAL_MS,
        );
      } catch {
        pollAttempts.current += 1;
        if (pollAttempts.current >= MAX_POLL_ATTEMPTS) {
          setPollTimedOut(true);
          return;
        }
        pollTimer.current = setTimeout(
          () => pollOrder(orderId),
          POLL_INTERVAL_MS,
        );
      }
    },
    [refreshCart],
  );

  useEffect(() => stopPolling, [stopPolling]);

  function checkAgain() {
    if (!order) return;
    setPollTimedOut(false);
    pollAttempts.current = 0;
    pollOrder(order.id);
  }

  const selectedSavedAddress =
    deliveryMode === "saved"
      ? ((savedAddresses ?? []).find((a) => a.id === selectedAddressId) ?? null)
      : null;

  const effectiveDeliveryLat =
    fulfillmentMethod === "DELIVERY"
      ? deliveryMode === "saved"
        ? (selectedSavedAddress?.latitude ?? undefined)
        : coords?.lat
      : undefined;
  const effectiveDeliveryLng =
    fulfillmentMethod === "DELIVERY"
      ? deliveryMode === "saved"
        ? (selectedSavedAddress?.longitude ?? undefined)
        : coords?.lng
      : undefined;

  useEffect(() => {
    if (fulfillmentMethod !== "DELIVERY") return;
    loadCart(currency || undefined, effectiveDeliveryLat, effectiveDeliveryLng);
  }, [fulfillmentMethod, effectiveDeliveryLat, effectiveDeliveryLng, loadCart, currency]);

  useEffect(() => {
    if (phoneNumber) return;
    const candidate =
      deliveryMode === "saved"
        ? selectedSavedAddress?.recipientPhone
        : newAddressRecipientPhone;
    if (candidate) setPhoneNumber(candidate);
  }, [deliveryMode, selectedSavedAddress, newAddressRecipientPhone, phoneNumber]);

  useEffect(() => {
    if (!phoneNumber || network) return;
    const detected = detectNetwork(phoneNumber);
    if (detected) setNetwork(detected);
  }, [phoneNumber, network]);

  async function handleSubmit() {
    setFormError(null);

    if (fulfillmentMethod === "DELIVERY") {
      if (deliveryMode === "saved") {
        if (!selectedSavedAddress) {
          setFormError(t.selectAddressError);
          return;
        }
      } else {
        if (deliveryAddress.trim().length < 10) {
          setFormError(t.addressError);
          return;
        }
        if (!coords) {
          setFormError(t.locationRequiredError);
          return;
        }
      }
    }

    if (paymentTab === "mobile") {
      if (!network) {
        setFormError(t.selectNetworkError);
        return;
      }
      if (phoneNumber.replace(/\D/g, "").length < 9) {
        setFormError(t.phoneNumberError);
        return;
      }
    } else if (paymentTab === "card") {
      return; // card is disabled/coming soon — nothing to submit
    }

    const effectiveAddress =
      fulfillmentMethod === "DELIVERY"
        ? deliveryMode === "saved" && selectedSavedAddress
          ? selectedSavedAddress.address +
            (selectedSavedAddress.city ? `, ${selectedSavedAddress.city}` : "")
          : deliveryAddress.trim() +
            (newAddressCity.trim() ? `, ${newAddressCity.trim()}` : "")
        : undefined;

    setSubmitting(true);
    try {
      const result = await checkout({
        shopId,
        paymentMethod:
          paymentTab === "cod" ? "CASH_ON_DELIVERY" : "ONLINE_PAYMENT",
        fulfillmentMethod,
        deliveryAddress: effectiveAddress,
        deliveryLatitude: effectiveDeliveryLat,
        deliveryLongitude: effectiveDeliveryLng,
        payerPhoneNumber: paymentTab === "mobile" ? phoneNumber : undefined,
        network: paymentTab === "mobile" ? network || undefined : undefined,
        countryCode: "CD",
        currency,
      });

      if (
        fulfillmentMethod === "DELIVERY" &&
        deliveryMode === "new" &&
        saveNewAddress
      ) {
        createAddress({
          label: newAddressLabel.trim() || undefined,
          recipientName: newAddressRecipientName.trim() || undefined,
          recipientPhone: newAddressRecipientPhone.trim() || undefined,
          address: deliveryAddress.trim(),
          city: newAddressCity.trim() || undefined,
          latitude: coords?.lat,
          longitude: coords?.lng,
        }).catch(() => {
          // best-effort — don't block the order on this
        });
      }

      setOrder(result.order);
      if (paymentTab === "cod") {
        // Cash on delivery orders are confirmed immediately — no payment to poll for.
        setPhase("success");
        refreshCart();
      } else {
        setPhase("polling");
        pollAttempts.current = 0;
        setPollTimedOut(false);
        pollOrder(result.order.id);
      }
    } catch (err) {
      setFormError(extractMessage(err, t.genericError));
    } finally {
      setSubmitting(false);
    }
  }

  function resetToForm() {
    stopPolling();
    setPhase("form");
    setOrder(null);
    setPollTimedOut(false);
  }

  if (phase === "loading" || authLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-6" />
      </main>
    );
  }

  if (phase === "empty") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <Store className="size-10 text-muted-foreground" />
        <h1 className="text-lg font-semibold text-foreground">
          {t.emptyTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{t.emptyDescription}</p>
        <Button
          nativeButton={false}
          render={<Link href="/products" />}
          className="mt-2"
        >
          {t.browseProducts}
        </Button>
      </main>
    );
  }

  if (phase === "polling") {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <h1 className="text-lg font-semibold text-foreground">
          {pollTimedOut ? t.pollingTimeoutTitle : t.pollingTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {pollTimedOut ? t.pollingTimeoutDescription : t.pollingDescription}
        </p>
        {pollTimedOut && (
          <Button type="button" variant="outline" onClick={checkAgain}>
            {t.checkAgain}
          </Button>
        )}
      </main>
    );
  }

  if (phase === "success") {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <CheckCircle2 className="size-12 text-emerald-500" />
        <h1 className="text-xl font-semibold text-foreground">
          {t.successTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{t.successDescription}</p>
        {order && (
          <p className="text-xs text-muted-foreground">
            {t.orderNumber} #{order.id.slice(0, 8).toUpperCase()} ·{" "}
            {formatMoney(Number(order.total), order.currency)}
          </p>
        )}
        <Button
          nativeButton={false}
          render={<Link href="/products" />}
          className="mt-2"
        >
          {t.continueShopping}
        </Button>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <XCircle className="size-12 text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">
          {t.errorTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {order?.payment?.failureReason ??
            order?.failureReason ??
            t.genericError}
        </p>
        <div className="mt-2 flex gap-2">
          <Button type="button" variant="outline" onClick={resetToForm}>
            {t.tryAgain}
          </Button>
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/support" />}
          >
            {t.contactSupport}
          </Button>
        </div>
      </main>
    );
  }

  if (!cart) return null;

  const deliveryFee =
    fulfillmentMethod === "DELIVERY" ? (cart.displayDeliveryFee ?? 0) : 0;
  const itemsSubtotal = cart.items.reduce(
    (sum, item) =>
      item.displayPrice != null ? sum + item.displayPrice * item.quantity : sum,
    0,
  );
  const total = itemsSubtotal + deliveryFee;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link
        href="/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:mb-6"
      >
        <ChevronLeft className="size-4" />
        {t.back}
      </Link>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="order-2 flex flex-col gap-5 rounded-2xl border border-border p-4 sm:p-6 lg:sticky lg:top-24 lg:order-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="shrink-0 text-lg font-semibold text-foreground">
              {t.orderSummary}
            </h2>
            {cart.shop && (
              <span className="min-w-0 truncate text-sm text-muted-foreground">
                {cart.shop.name}
              </span>
            )}
          </div>

          <ul className="flex flex-col gap-4">
            {cart.items.map((item) => {
              const image = item.variant.product.images[0]?.url;
              return (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-foreground">
                    {image && (
                      <Image
                        src={image}
                        alt={item.variant.product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {item.variant.product.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      × {item.quantity}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-foreground">
                    {item.displayPrice != null && cart.cartCurrency
                      ? formatMoney(item.displayPrice, cart.cartCurrency)
                      : "—"}
                  </span>
                </li>
              );
            })}
          </ul>

          <Field className="border-t border-border pt-4">
            <FieldLabel htmlFor="checkout-currency">{t.currency}</FieldLabel>
            <NativeSelect
              id="checkout-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full"
            >
              {PRODUCT_CURRENCIES.map((c) => (
                <NativeSelectOption key={c} value={c}>
                  {c}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t.subtotal}</span>
              <span className="text-foreground">
                {formatMoney(itemsSubtotal, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t.deliveryFee}</span>
              <span className="text-foreground">
                {fulfillmentMethod === "DELIVERY"
                  ? formatMoney(deliveryFee, currency)
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
              <span className="text-foreground">{t.total}</span>
              <span className="text-foreground">
                {formatMoney(total, currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t.checkoutTitle}
          </h1>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>{t.fulfillment}</FieldLabel>
              <RadioGroup
                value={fulfillmentMethod}
                onValueChange={(value) =>
                  handleFulfillmentChange(value as "PICKUP" | "DELIVERY")
                }
                className="flex flex-row gap-4"
              >
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <RadioGroupItem value="PICKUP" />
                  {t.pickup}
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <RadioGroupItem value="DELIVERY" />
                  {t.delivery}
                </label>
              </RadioGroup>
            </Field>

            {fulfillmentMethod === "DELIVERY" && (
              <>
                {savedAddresses === null ? (
                  <FieldDescription className="flex items-center gap-1.5">
                    <Spinner className="size-3.5" />
                    {t.loadingAddresses}
                  </FieldDescription>
                ) : deliveryMode === "saved" && savedAddresses.length > 0 ? (
                  <Field>
                    <FieldLabel>{t.deliveryAddress}</FieldLabel>
                    <RadioGroup
                      value={selectedAddressId ?? ""}
                      onValueChange={setSelectedAddressId}
                      className="gap-2"
                    >
                      {savedAddresses.map((a) => (
                        <label
                          key={a.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                            selectedAddressId === a.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40",
                          )}
                        >
                          <RadioGroupItem value={a.id} className="mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {a.label || t.addressReference}
                              </span>
                              {a.isDefault && (
                                <Badge variant="secondary">
                                  {t.defaultBadge}
                                </Badge>
                              )}
                            </div>
                            <p className="truncate text-muted-foreground">
                              {a.address}
                              {a.city ? `, ${a.city}` : ""}
                            </p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>

                    <button
                      type="button"
                      onClick={switchToNewAddress}
                      className="w-fit text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {t.addNewAddress}
                    </button>
                  </Field>
                ) : (
                  <>
                    <Field>
                      <FieldLabel htmlFor="new-address-label">
                        {t.addressLabel}
                      </FieldLabel>
                      <Input
                        id="new-address-label"
                        value={newAddressLabel}
                        onChange={(e) => setNewAddressLabel(e.target.value)}
                        placeholder={t.addressLabelPlaceholder}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="new-address-recipient-name">
                        {t.recipientName}
                      </FieldLabel>
                      <Input
                        id="new-address-recipient-name"
                        value={newAddressRecipientName}
                        onChange={(e) =>
                          setNewAddressRecipientName(e.target.value)
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="new-address-recipient-phone">
                        {t.recipientPhone}
                      </FieldLabel>
                      <Input
                        id="new-address-recipient-phone"
                        type="tel"
                        placeholder="+243900000000"
                        value={newAddressRecipientPhone}
                        onChange={(e) =>
                          setNewAddressRecipientPhone(e.target.value)
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="delivery-address">
                        {t.addressReference}
                      </FieldLabel>
                      <Textarea
                        id="delivery-address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder={t.deliveryAddressPlaceholder}
                        className="min-h-20 resize-y"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="new-address-city">
                        {t.city}
                      </FieldLabel>
                      <Input
                        id="new-address-city"
                        value={newAddressCity}
                        onChange={(e) => setNewAddressCity(e.target.value)}
                      />
                    </Field>

                    <FieldDescription className="-mt-2 flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" />
                      {locating ? (
                        <span className="flex items-center gap-1.5">
                          <Spinner className="size-3.5" />
                          {t.locating}
                        </span>
                      ) : coords ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {t.locationCaptured}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {locationError ?? t.locationError}
                          <button
                            type="button"
                            onClick={requestLocation}
                            className="font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {t.retryLocation}
                          </button>
                        </span>
                      )}
                    </FieldDescription>

                    <label className="-mt-2 flex items-center gap-2 text-sm text-foreground">
                      <Checkbox
                        checked={saveNewAddress}
                        onCheckedChange={(checked) =>
                          setSaveNewAddress(checked === true)
                        }
                      />
                      {t.saveAddressForLater}
                    </label>

                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={switchToSavedAddress}
                        className="-mt-2 w-fit text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {t.useSavedAddress}
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </FieldGroup>

          <div className="flex flex-col gap-3 border-t border-border pt-6">
            <span className="text-sm font-medium text-foreground">
              {t.paymentMethod}
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentTab("mobile")}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-colors ${
                  paymentTab === "mobile"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Smartphone className="size-5" />
                {t.mobileMoney}
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab("cod")}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-colors ${
                  paymentTab === "cod"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Banknote className="size-5" />
                {t.cashOnDelivery}
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab("card")}
                className={`relative flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm text-muted-foreground transition-colors ${
                  paymentTab === "card"
                    ? "border-primary/60 bg-muted/40"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <CreditCard className="size-5" />
                {t.card}
                <Badge variant="secondary" className="absolute -top-2 right-2">
                  {t.comingSoon}
                </Badge>
              </button>
            </div>

            {paymentTab === "mobile" ? (
              <FieldGroup className="gap-4 pt-2">
                <Field>
                  <FieldLabel>{t.network}</FieldLabel>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {MOBILE_MONEY_NETWORKS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNetwork(n)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors",
                          network === n
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {n === "africell" ? (
                          <div className="flex h-10 w-full items-center justify-center rounded-sm bg-foreground px-2">
                            <AfricellLogo className="h-4 w-auto" />
                          </div>
                        ) : brokenLogos.has(n) ? (
                          <Smartphone className="size-6" />
                        ) : (
                          <Image
                            src={NETWORK_LOGOS[n]}
                            alt=""
                            width={38}
                            height={38}
                            className="size-10 rounded-sm object-contain"
                            onError={() =>
                              setBrokenLogos((prev) => new Set(prev).add(n))
                            }
                          />
                        )}
                        <span className="text-center leading-tight">
                          {NETWORK_LABELS[n]}
                        </span>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">{t.phoneNumber}</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="+243 8xx xxx xxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </Field>
              </FieldGroup>
            ) : paymentTab === "cod" ? (
              <p className="pt-2 text-sm text-muted-foreground">
                {t.codDescription}
              </p>
            ) : (
              <FieldGroup className="gap-4 pt-2 opacity-50">
                <Field>
                  <FieldLabel>Card number</FieldLabel>
                  <Input disabled placeholder="•••• •••• •••• ••••" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Expiry</FieldLabel>
                    <Input disabled placeholder="MM/YY" />
                  </Field>
                  <Field>
                    <FieldLabel>CVC</FieldLabel>
                    <Input disabled placeholder="CVC" />
                  </Field>
                </div>
              </FieldGroup>
            )}
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <Button
            type="button"
            size="lg"
            disabled={submitting || paymentTab === "card"}
            onClick={handleSubmit}
            className="h-12 w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t.submitting}
              </>
            ) : paymentTab === "cod" ? (
              t.placeOrder
            ) : (
              t.payAmount(formatMoney(total, currency))
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            {paymentTab === "cod" ? t.codTerms : t.terms}
          </p>
        </div>
      </div>
    </main>
  );
}

export default CheckoutView;
