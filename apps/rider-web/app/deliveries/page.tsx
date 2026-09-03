"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LogOut, Package } from "lucide-react";
import { getMyDeliveries, type DeliveryListItem } from "@/lib/api";
import { apiErrorMessage } from "@/lib/api-client";
import { clearTokens, isSignedIn } from "@/lib/auth";

const ACTIVE_STATUSES = ["RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"];

const STATUS_LABELS: Record<string, string> = {
  RIDER_ASSIGNED: "Assigned",
  PICKED_UP: "Picked up",
  ON_THE_WAY: "On the way",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
};

function formatMoney(amount: string, currency: string) {
  const num = Number(amount);
  return currency === "CDF"
    ? `${Math.round(num).toLocaleString("fr-FR")} ${currency}`
    : `${num.toFixed(2)} ${currency}`;
}

export default function DeliveriesPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<DeliveryListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/sign-in");
      return;
    }
    getMyDeliveries()
      .then((result) => setDeliveries(result.orders))
      .catch((err) => setError(apiErrorMessage(err, "Couldn't load deliveries.")));
  }, [router]);

  const active = (deliveries ?? []).filter((d) => ACTIVE_STATUSES.includes(d.status));

  function handleLogout() {
    clearTokens();
    router.replace("/sign-in");
  }

  return (
    <main className="min-h-screen bg-muted">
      <header className="flex items-center justify-between border-b border-border bg-background px-4 py-4">
        <h1 className="text-lg font-semibold">My deliveries</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </header>

      <div className="mx-auto max-w-md px-4 py-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {deliveries === null && !error && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}

        {deliveries !== null && active.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background py-12 text-center">
            <Package className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No active deliveries assigned right now.
            </p>
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {active.map((d) => (
            <li key={d.id}>
              <Link
                href={`/deliveries/${d.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-background p-4 hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.shop.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.buyer.name} · {formatMoney(d.total, d.currency)}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {STATUS_LABELS[d.status] ?? d.status}
                  </span>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
