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

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

// One entry per key the backend's getDashboardMetrics() actually
// returns per day — keep this in sync with DashboardMetricPoint.
const METRIC_OPTIONS = [
  { key: "orders", label: "Orders", color: "var(--chart-1)" },
  { key: "gmv", label: "GMV (USD)", color: "var(--chart-2)" },
  { key: "newUsers", label: "New Users", color: "var(--chart-3)" },
  { key: "newSellers", label: "New Sellers", color: "var(--chart-4)" },
  { key: "kycSubmissions", label: "KYC Submissions", color: "var(--chart-5)" },
  { key: "shopsPublished", label: "Shops Published", color: "var(--chart-1)" },
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
      setError(getErrorMessage(err, "Couldn't load chart data."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional refetch on range change
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
        <CardTitle>{activeMetric.label} over time</CardTitle>
        <CardDescription>
          <span className="text-muted-foreground text-xs">
            Daily activity, last {range} days
          </span>
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <Select
            value={metric}
            onValueChange={(v) => setMetric(v as MetricKey)}
          >
            <SelectTrigger className="w-[170px]" size="sm">
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
            <ToggleGroupItem value="90">3 months</ToggleGroupItem>
            <ToggleGroupItem value="30">30 days</ToggleGroupItem>
            <ToggleGroupItem value="7">7 days</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {error ? (
          <div className="flex h-[250px] flex-col items-center justify-center gap-3">
            <p className="text-destructive text-sm">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadMetrics(range)}
            >
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
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
                tickFormatter={(value: string) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value as string).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
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
