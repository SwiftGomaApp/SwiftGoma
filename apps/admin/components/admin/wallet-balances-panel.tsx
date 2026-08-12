"use client";

import { Wallet, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  normalizeBalanceItems,
  sortBalanceItems,
  formatBalanceDisplay,
  type BalanceDisplayItem,
  type DrcCurrency,
} from "@/lib/drc-payments";

const CURRENCY_STYLES: Record<
  DrcCurrency,
  { accent: string; badge: string; icon: string }
> = {
  CDF: {
    accent: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  USD: {
    accent: "from-blue-500/15 via-blue-500/5 to-transparent",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    icon: "text-blue-600 dark:text-blue-400",
  },
};

function BalanceCard({
  item,
  variant,
}: {
  item: BalanceDisplayItem;
  variant: "wallet" | "network";
}) {
  const styles = item.currency ? CURRENCY_STYLES[item.currency] : null;
  const Icon = variant === "network" ? Radio : Wallet;
  const formatted = formatBalanceDisplay(item.amount, item.currency);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        styles ? "border-border/60" : "border-border",
      )}
    >
      {styles && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-linear-to-br",
            styles.accent,
          )}
        />
      )}
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                "inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide uppercase",
                styles?.badge ?? "bg-muted text-muted-foreground",
              )}
            >
              {item.label}
            </span>
            {item.subtitle && (
              <span className="text-muted-foreground text-xs capitalize">
                {item.subtitle}
              </span>
            )}
          </div>
          <div
            className={cn(
              "bg-background/80 flex size-9 items-center justify-center rounded-lg border shadow-sm",
              styles?.icon ?? "text-muted-foreground",
            )}
          >
            <Icon className="size-4" />
          </div>
        </div>
        <div>
          <p className="flex flex-wrap items-baseline gap-x-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
            {formatted.prefix ? (
              <span className="text-muted-foreground text-xl font-semibold sm:text-2xl">
                {formatted.prefix}
              </span>
            ) : null}
            <span>{formatted.amount}</span>
            {formatted.suffix ? (
              <span
                className={cn(
                  "font-semibold",
                  item.currency === "USD"
                    ? "text-muted-foreground text-lg sm:text-xl"
                    : "text-muted-foreground text-base sm:text-lg",
                )}
              >
                {formatted.suffix}
              </span>
            ) : null}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {variant === "network" ? "Solde réseau" : "Solde disponible"}
          </p>
        </div>
      </div>
    </div>
  );
}

function BalanceSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-xl border p-5">
          <Skeleton className="mb-4 h-5 w-16" />
          <Skeleton className="h-9 w-40" />
        </div>
      ))}
    </div>
  );
}

interface WalletBalancesPanelProps {
  title: string;
  subtitle?: string;
  items: unknown;
  isLoading?: boolean;
  error?: string | null;
  variant?: "wallet" | "network";
  emptyMessage?: string;
}

export function WalletBalancesPanel({
  title,
  subtitle,
  items,
  isLoading = false,
  error = null,
  variant = "wallet",
  emptyMessage = "Aucune donnée de solde disponible.",
}: WalletBalancesPanelProps) {
  const displayItems = sortBalanceItems(normalizeBalanceItems(items));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex items-center gap-2">
          {variant === "network" ? (
            <Radio className="text-muted-foreground size-4" />
          ) : (
            <Wallet className="text-muted-foreground size-4" />
          )}
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {subtitle && (
              <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        {isLoading ? (
          <BalanceSkeleton />
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : displayItems.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {displayItems.map((item) => (
              <BalanceCard key={item.id} item={item} variant={variant} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
