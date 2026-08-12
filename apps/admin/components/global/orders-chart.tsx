"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  getDashboardMetrics,
  type DashboardMetricPoint,
} from "@/lib/api/routes/dashboard";
import { ApiError } from "@/lib/api/client";
import { formatChartDay } from "@/lib/i18n/format";
import { ui } from "@/lib/i18n/common";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

const METRIC_OPTIONS = [
  { key: "orders", label: "Commandes", color: "var(--chart-1)" },
  { key: "gmv", label: "GMV (USD)", color: "var(--chart-2)" },
  { key: "newUsers", label: "Nouveaux utilisateurs", color: "var(--chart-3)" },
  { key: "newSellers", label: "Nouveaux vendeurs", color: "var(--chart-4)" },
  { key: "kycSubmissions", label: "Soumissions KYC", color: "var(--chart-5)" },
  { key: "shopsPublished", label: "Boutiques publiées", color: "var(--chart-1)" },
] as const;

type MetricKey = (typeof METRIC_OPTIONS)[number]["key"];

export function MetricsChart() {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [metric, setMetric] = useState<MetricKey>("orders");

  const [series, setSeries] = useState<DashboardMetricPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async (days: 7 | 30 | 90) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getDashboardMetrics(days);
      setSeries(res.series);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les données du graphique."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics(range);
  }, [range]);

  const activeMetric = METRIC_OPTIONS.find((m) => m.key === metric)!;

  const chartConfig = {
    [metric]: {
      label: activeMetric.label,
      color: activeMetric.color,
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{activeMetric.label} dans le temps</CardTitle>
        <CardDescription>
          <span className="text-muted-foreground text-xs">
            Activité quotidienne, {range} derniers jours
          </span>
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <Select
            value={metric}
            onValueChange={(v) => setMetric(v as MetricKey)}
          >
            <SelectTrigger className="w-42.5" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRIC_OPTIONS.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup
            value={[String(range)]}
            onValueChange={(values) => {
              const value = values[0];
              if (value) setRange(Number(value) as 7 | 30 | 90);
            }}
            variant="outline"
            className="hidden @[540px]/card:flex"
          >
            <ToggleGroupItem value="90">3 mois</ToggleGroupItem>
            <ToggleGroupItem value="30">30 jours</ToggleGroupItem>
            <ToggleGroupItem value="7">7 jours</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {error ? (
          <div className="flex h-62.5 flex-col items-center justify-center gap-3">
            <p className="text-destructive text-sm">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadMetrics(range)}
            >
              {ui.retry}
            </Button>
          </div>
        ) : isLoading ? (
          <Skeleton className="h-62.5 w-full" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-62.5 w-full"
          >
            <AreaChart data={series}>
              <defs>
                <linearGradient id="fillMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${metric})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${metric})`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string) => formatChartDay(value)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatChartDay(String(value))}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey={metric}
                type="natural"
                fill="url(#fillMetric)"
                stroke={`var(--color-${metric})`}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
