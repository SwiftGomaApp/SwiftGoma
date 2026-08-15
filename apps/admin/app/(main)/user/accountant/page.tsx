"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  History,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAccountantOverview,
  type AccountantOverview,
} from "@/lib/api/routes/accountant";
import { getErrorMessage } from "@/lib/get-error-message";
import { AccountantReportPanel } from "@/components/admin/accountant-report-panel";
import { AccountantReportHistoryPanel } from "@/components/admin/accountant-report-history-panel";
import { ui } from "@/lib/i18n/common";

function StatCard({
  title,
  value,
  subtitle,
  isLoading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const QUICK_LINKS = [
  { title: "Dépenses SwiftGoma", href: "/expenses", icon: Receipt },
  {
    title: "Statistiques de facturation",
    href: "/billing/stats",
    icon: Receipt,
  },
  { title: "Commandes", href: "/orders", icon: ShoppingBag },
  { title: "Abonnements", href: "/subscriptions", icon: TrendingUp },
  {
    title: "Historique des transactions",
    href: "/payments/transactions",
    icon: History,
  },
  { title: "PawaPay", href: "/payments/pawapay", icon: CreditCard },
  { title: "MbiyoPay", href: "/payments/mbiyopay", icon: Wallet },
] as const;

function formatGmv(
  buckets: { currency: string; total: number; orderCount: number }[],
) {
  if (buckets.length === 0) return "—";
  return buckets.map((b) => `${b.total} ${b.currency}`).join(" · ");
}

export default function AccountantDashboardPage() {
  const [overview, setOverview] = useState<AccountantOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportHistoryKey, setReportHistoryKey] = useState(0);

  async function loadOverview() {
    setIsLoading(true);
    setError(null);
    try {
      setOverview(await getAccountantOverview());
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Impossible de charger le tableau de bord comptable.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Tableau de bord comptable</h1>
        <p className="text-muted-foreground text-sm">
          Vue financière en lecture seule — facturation, abonnements, commandes
          et paiements sortants.
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center justify-between pt-6">
            <p className="text-destructive text-sm">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadOverview}
            >
              {ui.retry}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title="Documents émis"
          value={overview?.invoices.totalDocuments ?? 0}
          subtitle={`${overview?.invoices.byType.INVOICE ?? 0} factures · ${overview?.invoices.byType.RECEIPT ?? 0} reçus`}
          isLoading={isLoading}
        />
        <StatCard
          title="Abonnements actifs"
          value={overview?.subscriptions.byStatus.ACTIVE ?? 0}
          subtitle={`${overview?.subscriptions.totalSubscriptions ?? 0} au total`}
          isLoading={isLoading}
        />
        <StatCard
          title="Commandes complétées"
          value={overview?.orders.completed ?? 0}
          subtitle={`${overview?.orders.total ?? 0} commandes au total`}
          isLoading={isLoading}
        />
        <StatCard
          title="GMV complétée"
          value={formatGmv(overview?.orders.gmvByCurrency ?? [])}
          isLoading={isLoading}
        />
        <StatCard
          title="Paiements admin"
          value={overview?.adminPayouts.total ?? 0}
          subtitle={`${overview?.adminPayouts.byStatus.PROCESSING ?? 0} en cours`}
          isLoading={isLoading}
        />
        <StatCard
          title="Retraits vendeurs"
          value={overview?.sellerPayouts.total ?? 0}
          isLoading={isLoading}
        />
      </div>

      <AccountantReportPanel
        onReportSaved={() => setReportHistoryKey((key) => key + 1)}
      />
      <AccountantReportHistoryPanel refreshKey={reportHistoryKey} />

      <div>
        <h2 className="mb-3 text-sm font-semibold">Accès rapide</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:bg-muted flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
            >
              <link.icon className="text-muted-foreground h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{link.title}</span>
              <ArrowRight className="text-muted-foreground ml-auto h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      </div>

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-6">
          <p className="text-sm font-medium">Accès en lecture seule</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Le compte comptable peut consulter les rapports financiers et
            l&apos;historique des paiements, mais ne peut pas initier de
            paiements sortants, modifier les forfaits ou gérer les utilisateurs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
