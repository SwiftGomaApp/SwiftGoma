"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  getSupportMetrics,
  type SupportMetricPoint,
} from "@/lib/api/routes/dashboard";
import { getErrorMessage } from "@/lib/get-error-message";
import { formatChartDay } from "@/lib/i18n/format";
import { ui } from "@/lib/i18n/common";

const METRIC_OPTIONS = [
  { key: "kycSubmissions", label: "Soumissions KYC", color: "var(--chart-1)" },
  { key: "newSellers", label: "Nouveaux vendeurs", color: "var(--chart-2)" },
  { key: "newUsers", label: "Nouveaux utilisateurs", color: "var(--chart-3)" },
  { key: "shopsPublished", label: "Boutiques publiées", color: "var(--chart-4)" },
] as const;

type MetricKey = (typeof METRIC_OPTIONS)[number]["key"];

export function SupportMetricsChart() {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [metric, setMetric] = useState<MetricKey>("kycSubmissions");
  const [series, setSeries] = useState<SupportMetricPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMetrics(days: 7 | 30 | 90) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getSupportMetrics(days);
      setSeries(res.series);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les données du graphique."));
    } finally {
      setIsLoading(false);
    }
  }

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
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Activité</CardTitle>
          <p className="text-muted-foreground text-sm">
            Inscription et croissance de la marketplace dans le temps.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            value={[String(range)]}
            onValueChange={(values) => {
              const value = values[0];
              if (value) setRange(Number(value) as 7 | 30 | 90);
            }}
            variant="outline"
          >
            <ToggleGroupItem value="7">7j</ToggleGroupItem>
            <ToggleGroupItem value="30">30j</ToggleGroupItem>
            <ToggleGroupItem value="90">90j</ToggleGroupItem>
          </ToggleGroup>
          <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
            <SelectTrigger className="w-44">
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
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center justify-between rounded-lg border border-dashed p-6">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={() => loadMetrics(range)}>
              {ui.retry}
            </Button>
          </div>
        ) : isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
            <AreaChart data={series}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) => formatChartDay(value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatChartDay(String(value))}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={`var(--color-${metric})`}
                fill={`var(--color-${metric})`}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
