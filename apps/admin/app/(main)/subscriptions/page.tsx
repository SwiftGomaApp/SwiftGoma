"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  getSubscriptionStats,
  getSubscriptionRevenue,
  listAdminSubscriptions,
  type SubscriptionStats,
  type SubscriptionRevenue,
  type SubscriptionStatus,
  type AdminSubscriptionSummary,
} from "@/lib/api/routes/subscriptions";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/i18n/format";
import { subscriptionStatusLabels, labelOf } from "@/lib/i18n/labels";
import { ui } from "@/lib/i18n/common";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

const paymentStatusLabels: Record<string, string> = {
  SUCCEEDED: "Réussi",
  PENDING: "En attente",
  FAILED: "Échoué",
};

const subscriptionStatLabels: Record<string, string> = {
  ACTIVE: subscriptionStatusLabels.ACTIVE,
  PENDING_PAYMENT: "Paiement en attente",
  PAST_DUE: subscriptionStatusLabels.PAST_DUE,
  FAILED_PAYMENT: "Échec de paiement",
  EXPIRED: subscriptionStatusLabels.EXPIRED,
  CANCELED: subscriptionStatusLabels.CANCELED,
};

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function formatBuckets(buckets: { currency: string; total?: string; totalCollected?: string }[]) {
  if (buckets.length === 0) return "—";
  return buckets
    .map((b) => `${b.total ?? b.totalCollected} ${b.currency}`)
    .join(" · ");
}

export default function SubscriptionsPage() {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [revenue, setRevenue] = useState<SubscriptionRevenue | null>(null);
  const [items, setItems] = useState<AdminSubscriptionSummary[]>([]);
  const [listPage, setListPage] = useState(1);
  const [listTotalPages, setListTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  async function loadStats() {
    setIsLoading(true);
    setError(null);
    try {
      const [statsResult, revenueResult] = await Promise.all([
        getSubscriptionStats(),
        getSubscriptionRevenue(),
      ]);
      setStats(statsResult);
      setRevenue(revenueResult);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les données d'abonnement."));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadList() {
    setListLoading(true);
    setListError(null);
    try {
      const data = await listAdminSubscriptions({
        page: listPage,
        limit: 20,
        status: statusFilter,
        search,
      });
      setItems(data.items);
      setListTotalPages(data.totalPages);
    } catch (err) {
      setListError(getErrorMessage(err, "Impossible de charger la liste des abonnements."));
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadStats();
  }, []);

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on filter change
  }, [listPage, search, statusFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setListPage(1);
    setSearch(searchInput.trim());
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats || !revenue) {
    return <p className="text-destructive text-sm">{error ?? "Aucune donnée."}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Abonnements</h1>
        <p className="text-muted-foreground text-sm">
          {stats.totalSubscriptions} abonnement
          {stats.totalSubscriptions === 1 ? "" : "s"} au total
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title={subscriptionStatLabels.ACTIVE} value={stats.byStatus.ACTIVE ?? 0} />
        <StatCard title={subscriptionStatLabels.PENDING_PAYMENT} value={stats.byStatus.PENDING_PAYMENT ?? 0} />
        <StatCard title={subscriptionStatLabels.PAST_DUE} value={stats.byStatus.PAST_DUE ?? 0} />
        <StatCard title={subscriptionStatLabels.FAILED_PAYMENT} value={stats.byStatus.FAILED_PAYMENT ?? 0} />
        <StatCard title={subscriptionStatLabels.EXPIRED} value={stats.byStatus.EXPIRED ?? 0} />
        <StatCard title={subscriptionStatLabels.CANCELED} value={stats.byStatus.CANCELED ?? 0} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Abonnements actifs par forfait</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.activeByPlan.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun abonnement actif.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {stats.activeByPlan.map((row) => (
                  <div key={row.planId} className="flex items-center justify-between text-sm">
                    <span>{row.planName}</span>
                    <Badge variant="outline">{row.activeCount}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenus</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-sm">
            <p>
              <span className="text-muted-foreground">Depuis le début :</span>{" "}
              {formatBuckets(revenue.allTimeCollected)}
            </p>
            <p>
              <span className="text-muted-foreground">Ce mois-ci :</span>{" "}
              {formatBuckets(revenue.thisMonthCollected)}
            </p>
            <p>
              <span className="text-muted-foreground">30 derniers jours :</span>{" "}
              {formatBuckets(revenue.last30DaysCollected)}
            </p>
            <p>
              <span className="text-muted-foreground">En attente / échoués :</span>{" "}
              {formatBuckets(revenue.pendingOrFailed)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">{revenue.note}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Paiements récents</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentPayments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun paiement pour l&apos;instant.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Forfait</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>{ui.status}</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.businessName}</TableCell>
                    <TableCell>{payment.planName}</TableCell>
                    <TableCell>
                      {payment.amount} {payment.currency}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={payment.status === "SUCCEEDED" ? "default" : "secondary"}
                      >
                        {labelOf(paymentStatusLabels, payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tous les abonnements</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 lg:flex-row"
          >
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Entreprise, vendeur ou forfait…"
              className="lg:flex-1"
            />
            <div className="flex flex-wrap gap-2">
              <NativeSelect
                value={statusFilter}
                onChange={(e) => {
                  setListPage(1);
                  setStatusFilter(e.target.value as SubscriptionStatus | "");
                }}
                className="min-w-40"
              >
                <NativeSelectOption value="">Tous les statuts</NativeSelectOption>
                {Object.entries(subscriptionStatLabels).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Button type="submit" variant="outline">
                <Search className="h-4 w-4" />
                Rechercher
              </Button>
            </div>
          </form>

          {listError && <p className="text-destructive text-sm">{listError}</p>}

          {listLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun abonnement trouvé.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Forfait</TableHead>
                    <TableHead>{ui.status}</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Paiements</TableHead>
                    <TableHead className="text-right">Détail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.sellerProfile.businessName}</TableCell>
                      <TableCell>{sub.plan.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {labelOf(subscriptionStatLabels, sub.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(sub.currentPeriodStart)} → {formatDate(sub.currentPeriodEnd)}
                      </TableCell>
                      <TableCell>{sub._count.payments}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={`/subscriptions/${sub.id}`} />}
                        >
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {listTotalPages > 1 && (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-muted-foreground text-sm">
                    Page {listPage} sur {listTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={listPage <= 1}
                      onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    >
                      Précédent
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={listPage >= listTotalPages}
                      onClick={() => setListPage((p) => p + 1)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
