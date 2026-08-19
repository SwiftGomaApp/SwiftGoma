"use client";

import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { BillingCycle, Plan } from "@/lib/api/routes/public";

function formatAmount(amount: string, currency: string) {
  const value = Number(amount);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currency === "CDF" ? 0 : 2,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(value);
}

function pricesForCycle(plan: Plan, cycle: BillingCycle) {
  return plan.prices.filter((price) => price.billingCycle === cycle);
}

function PlanCard({
  plan,
  cycle,
  highlighted,
}: {
  plan: Plan;
  cycle: BillingCycle;
  highlighted: boolean;
}) {
  const prices = pricesForCycle(plan, cycle);
  const primaryPrice = prices.find((p) => p.currency === "USD") ?? prices[0];
  const secondaryPrices = prices.filter((p) => p.id !== primaryPrice?.id);

  const features = [
    `${plan.maxProducts.toLocaleString("fr-FR")} produits actifs`,
    `${plan.maxPhotosPerProduct} photos par produit`,
    plan.maxShops > 1 ? `Jusqu'à ${plan.maxShops} boutiques` : "1 boutique",
    plan.prioritySupport ? "Support prioritaire" : "Support standard",
  ];

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        highlighted && "ring-2 ring-primary",
      )}
    >
      {highlighted && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Recommandé
        </Badge>
      )}

      <CardHeader className="gap-2 text-center">
        <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>

        {primaryPrice ? (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {formatAmount(primaryPrice.amount, primaryPrice.currency)}
              </span>
              <span className="text-sm text-muted-foreground">
                / {cycle === "MONTHLY" ? "mois" : "an"}
              </span>
            </div>
            {secondaryPrices.map((price) => (
              <span key={price.id} className="text-xs text-muted-foreground">
                ou {formatAmount(price.amount, price.currency)} /{" "}
                {cycle === "MONTHLY" ? "mois" : "an"}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            Tarif indisponible pour ce cycle
          </span>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <ul className="flex flex-col gap-2.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={highlighted ? "default" : "secondary"}
        >
          <Link href="/auth/sign-up">Commencer avec {plan.name}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function PricingPlans({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-border py-12 text-center">
        <ShieldCheck className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Nos formules seront bientôt disponibles ici.
        </p>
        <p className="text-sm text-muted-foreground">
          Contactez-nous directement pour démarrer dès maintenant.
        </p>
      </div>
    );
  }

  const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
  const highlightedIndex = Math.min(1, sorted.length - 1);

  return (
    <Tabs defaultValue="MONTHLY" className="flex flex-col items-center gap-8">
      <TabsList>
        <TabsTrigger value="MONTHLY">Mensuel</TabsTrigger>
        <TabsTrigger value="YEARLY">Annuel</TabsTrigger>
      </TabsList>

      {(["MONTHLY", "YEARLY"] as BillingCycle[]).map((cycle) => (
        <TabsContent key={cycle} value={cycle} className="w-full">
          <div
            className={cn(
              "grid grid-cols-1 gap-6 sm:grid-cols-2",
              sorted.length >= 3 && "lg:grid-cols-3",
            )}
          >
            {sorted.map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                cycle={cycle}
                highlighted={i === highlightedIndex}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
