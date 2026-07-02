"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  Loader2,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { sellerApi, type Plan } from "@/lib/api/seller-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type BillingCycle = "MONTHLY" | "ANNUAL";
type Provider = "ORANGE" | "AIRTEL" | "MPESA";

const providerLabels: Record<Provider, string> = {
  ORANGE: "Orange Money",
  AIRTEL: "Airtel Money",
  MPESA: "M-Pesa",
};

const formatPrice = (amount: number) => `$${amount}`;

// Stop polling after this long if nothing resolves, so the user isn't
// stuck on a spinner forever.
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

export function SubscriptionForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [selectedTier, setSelectedTier] = useState<Plan["tier"] | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState<Provider>("ORANGE");
  const [error, setError] = useState<string | null>(null);

  // Local UI phase, separate from the mutation itself.
  const [phase, setPhase] = useState<
    "form" | "polling" | "success" | "failed" | "timeout"
  >("form");
  const [initMessage, setInitMessage] = useState<string | null>(null);
  const pollStartedAt = useRef<number | null>(null);

  const plansQuery = useQuery({
    queryKey: ["plans"],
    queryFn: () => sellerApi.listPlans().then((res) => res.data),
  });

  // Poll only while we're actually waiting on a payment confirmation.
  const subscriptionQuery = useQuery({
    queryKey: ["seller", "subscription"],
    queryFn: () => sellerApi.getSubscription().then((res) => res.data),
    enabled: phase === "polling",
    refetchInterval: phase === "polling" ? POLL_INTERVAL_MS : false,
  });

  // React to poll results: flip phase based on server truth, not user taps.
  useEffect(() => {
    if (phase !== "polling") return;
    const sub = subscriptionQuery.data;
    if (!sub) return;

    if (sub.status === "ACTIVE") {
      setPhase("success");
      queryClient.invalidateQueries({ queryKey: ["seller", "subscription"] });
      return;
    }

    const latestPayment = sub.payments?.[0];
    if (latestPayment?.status === "FAILED") {
      setPhase("failed");
      return;
    }

    if (
      pollStartedAt.current &&
      Date.now() - pollStartedAt.current > POLL_TIMEOUT_MS
    ) {
      setPhase("timeout");
    }
  }, [phase, subscriptionQuery.data, queryClient]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedTier) throw new Error("Aucun plan sélectionné.");
      return sellerApi.subscribe({
        tier: selectedTier,
        billingCycle,
        currency: "USD",
        phoneNumber,
        provider,
      });
    },
    onSuccess: (res) => {
      setInitMessage(res.data.message);
      pollStartedAt.current = Date.now();
      setPhase("polling");
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneNumber) {
      setError("Veuillez entrer votre numéro Mobile Money.");
      return;
    }

    mutation.mutate();
  };

  const retryPayment = () => {
    setPhase("form");
    setInitMessage(null);
    pollStartedAt.current = null;
  };

  const selectedPlan = useMemo(
    () => plansQuery.data?.find((p) => p.tier === selectedTier),
    [plansQuery.data, selectedTier],
  );

  // ── Success ──────────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Abonnement activé</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre plan {selectedPlan?.name ?? ""} est maintenant actif.
          </p>
        </div>
        <Button onClick={() => router.push("/")}>
          Aller à mon tableau de bord
        </Button>
      </div>
    );
  }

  // ── Failed ───────────────────────────────────────────────────────────────
  if (phase === "failed") {
    const reason = subscriptionQuery.data?.payments?.[0]?.failureReason;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="size-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Paiement échoué</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {reason ??
              "Le paiement n'a pas pu être confirmé. Veuillez réessayer."}
          </p>
        </div>
        <Button onClick={retryPayment}>Réessayer</Button>
      </div>
    );
  }

  // ── Timeout ──────────────────────────────────────────────────────────────
  if (phase === "timeout") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Clock className="size-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Toujours en attente</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            La confirmation prend plus de temps que prévu. Vous recevrez une
            notification dès que le paiement sera confirmé.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/")}>
            Retour à l&apos;accueil
          </Button>
          <Button
            onClick={() => {
              pollStartedAt.current = Date.now();
              setPhase("polling");
            }}
          >
            Continuer à vérifier
          </Button>
        </div>
      </div>
    );
  }

  // ── Polling ──────────────────────────────────────────────────────────────
  if (phase === "polling") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Paiement en cours</h2>
          <p className="mt-1 text-sm text-muted-foreground">{initMessage}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Confirmez la transaction sur votre téléphone. Cette page se mettra à
          jour automatiquement.
        </p>
      </div>
    );
  }

  // ── Payment details form ────────────────────────────────────────────────
  if (selectedTier) {
    const price = selectedPlan
      ? billingCycle === "ANNUAL"
        ? selectedPlan.priceUsdAnnual
        : selectedPlan.priceUsdMonthly
      : 0;

    return (
      <form
        onSubmit={handleSubscribe}
        className="mx-auto flex max-w-sm flex-col gap-6"
      >
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setSelectedTier(null)}
            className="self-start text-sm text-muted-foreground hover:text-foreground"
          >
            ← Changer de plan
          </button>
          <h1 className="text-xl font-semibold">
            Plan {selectedPlan?.name} — {formatPrice(price)}/
            {billingCycle === "ANNUAL" ? "an" : "mois"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Payez via Mobile Money pour activer votre abonnement
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="provider">Opérateur</FieldLabel>
          <Select
            value={provider}
            onValueChange={(v) => setProvider(v as Provider)}
          >
            <SelectTrigger id="provider" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(providerLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="phoneNumber">Numéro Mobile Money</FieldLabel>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="243893456789"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={mutation.isPending}>
          <CreditCard className="size-4" />
          {mutation.isPending
            ? "Initialisation..."
            : `Payer ${formatPrice(price)}`}
        </Button>
      </form>
    );
  }

  // ── Plan picker ──────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">Choisissez votre plan</h1>
        <p className="text-sm text-muted-foreground">
          Aucune commission sur vos ventes — uniquement un abonnement mensuel
        </p>

        <Tabs
          value={billingCycle}
          onValueChange={(v) => setBillingCycle(v as BillingCycle)}
        >
          <TabsList>
            <TabsTrigger value="MONTHLY">Mensuel</TabsTrigger>
            <TabsTrigger value="ANNUAL">
              Annuel <span className="ml-1 text-primary">(-17%)</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {plansQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {plansQuery.data?.map((plan) => {
            const price =
              billingCycle === "ANNUAL"
                ? plan.priceUsdAnnual
                : plan.priceUsdMonthly;
            const isPopular = plan.tier === "BUSINESS";

            const features = [
              plan.maxProducts === -1
                ? "Produits illimités"
                : `${plan.maxProducts} produits actifs`,
              `${plan.maxImagesPerProduct} photos par produit`,
              plan.maxDeliverers === -1
                ? "Livreurs illimités"
                : `${plan.maxDeliverers} livreur${plan.maxDeliverers > 1 ? "s" : ""} rattaché${plan.maxDeliverers > 1 ? "s" : ""}`,
              plan.maxShops === 1
                ? "1 boutique"
                : `Jusqu'à ${plan.maxShops} boutiques`,
              plan.canFeatureProducts
                ? "Mise en avant des produits"
                : "Visibilité standard",
              plan.hasPrioritySupport ? "Support dédié" : "Support par e-mail",
            ];

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col gap-4 rounded-xl border p-6",
                  isPopular && "border-primary border-2",
                )}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    Populaire
                  </span>
                )}

                <div>
                  <p className="font-semibold">{plan.name}</p>
                  <p className="mt-1">
                    <span className="text-3xl font-bold text-primary">
                      ${price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{billingCycle === "ANNUAL" ? "an" : "mois"}
                    </span>
                  </p>
                </div>

                <ul className="flex flex-1 flex-col gap-2">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isPopular ? "default" : "outline"}
                  onClick={() => setSelectedTier(plan.tier)}
                >
                  Choisir {plan.name}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
