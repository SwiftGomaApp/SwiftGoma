"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAdminOverview,
  type AdminOverview,
} from "@/lib/api/routes/dashboard";
import { ApiError } from "@/lib/api/client";
import { MetricsChart } from "@/components/global/orders-chart";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

function StatCard({
  title,
  value,
  isLoading,
}: {
  title: string;
  value: string | number;
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
          <p className="text-2xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

const AdminDarshboard = () => {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        getErrorMessage(err, "Couldn't load the dashboard overview."),
      );
    } finally {
      setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadOverview();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/auth/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const gmvTotal = overview?.orders.gmvByCurrency
    .map((row) => `${row.total} ${row.currency}`)
    .join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          {user && (
            <p className="text-muted-foreground text-sm">
              Logged in as {user.name} ({user.role})
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>

      {overviewError && (
        <Card className="border-destructive">
          <CardContent className="flex items-center justify-between pt-6">
            <p className="text-destructive text-sm">{overviewError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadOverview}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={overview?.users.total ?? 0}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="Active Sellers"
          value={overview?.sellerProfiles.byStatus.ACTIVE ?? 0}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="Pending KYC"
          value={overview?.kyc.pendingAction ?? 0}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="Published Shops"
          value={overview?.shops.byStatus.PUBLISHED ?? 0}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="Published Products"
          value={overview?.products.byStatus.PUBLISHED ?? 0}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="Total Orders"
          value={overview?.orders.total ?? 0}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="Orders Awaiting Action"
          value={overview?.orders.awaitingAction ?? 0}
          isLoading={isLoadingOverview}
        />
        <StatCard
          title="GMV (completed)"
          value={gmvTotal || "—"}
          isLoading={isLoadingOverview}
        />
      </div>

      <MetricsChart />
    </div>
  );
};

export default AdminDarshboard;
