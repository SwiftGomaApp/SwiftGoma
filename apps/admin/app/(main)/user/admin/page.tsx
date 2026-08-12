"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAdminOverview,
  type AdminOverview,
} from "@/lib/api/routes/dashboard";
import { getErrorMessage } from "@/lib/get-error-message";
import { MetricsChart } from "@/components/global/orders-chart";
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

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const loadOverview = async () => {
    setIsLoadingOverview(true);
    setOverviewError(null);
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (err) {
      setOverviewError(
        getErrorMessage(err, "Impossible de charger l'aperçu du tableau de bord."),
      );
    } finally {
      setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadOverview();
  }, []);

  const gmvTotal = overview?.orders.gmvByCurrency
    .map((row) => `${row.total} ${row.currency}`)
    .join(" · ");

  const subscriptionStats = overview?.subscriptions;
  const invoiceStats = overview?.invoices;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">
          Activité de la marketplace en un coup d'œil — utilisateurs, vendeurs,
          commandes et revenus.
        </p>
      </div>

      {overviewError && (
        <Card className="border-destructive">
          <CardContent className="flex items-center justify-between pt-6">
            <p className="text-destructive text-sm">{overviewError}</p>
            <Button type="button" variant="outline" size="sm" onClick={loadOverview}>
              {ui.retry}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title="Total utilisateurs"
          value={overview?.users.total ?? 0}
          subtitle={`${overview?.users.byRole.SELLER ?? 0} vendeurs`}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="Vendeurs actifs"
          value={overview?.sellerProfiles.byStatus.ACTIVE ?? 0}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="KYC en attente"
          value={overview?.kyc.pendingAction ?? 0}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="Boutiques publiées"
          value={overview?.shops.byStatus.PUBLISHED ?? 0}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="Produits publiés"
          value={overview?.products.byStatus.PUBLISHED ?? 0}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="Total commandes"
          value={overview?.orders.total ?? 0}
          subtitle={`${overview?.orders.awaitingAction ?? 0} en attente d'action`}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="GMV (terminées)"
          value={gmvTotal || "—"}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="Abonnements actifs"
          value={subscriptionStats?.byStatus.ACTIVE ?? 0}
          subtitle={
            subscriptionStats?.totalSubscriptions
              ? `${subscriptionStats.totalSubscriptions} au total`
              : undefined
          }
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="Factures"
          value={invoiceStats?.totalDocuments ?? 0}
          subtitle={
            invoiceStats?.byType
              ? `${invoiceStats.byType.INVOICE ?? 0} factures · ${invoiceStats.byType.RECEIPT ?? 0} reçus`
              : undefined
          }
          isLoading={isLoadingOverview}
        />
      </div>

      <MetricsChart />
    </div>
  );
}
