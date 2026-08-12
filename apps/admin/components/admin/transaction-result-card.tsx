"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function flattenEntries(
  data: Record<string, unknown>,
  prefix = "",
): Array<[string, unknown]> {
  const entries: Array<[string, unknown]> = [];
  for (const [key, value] of Object.entries(data)) {
    const label = prefix ? `${prefix}.${key}` : key;
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      entries.push(...flattenEntries(value as Record<string, unknown>, label));
    } else {
      entries.push([label, value]);
    }
  }
  return entries;
}

export function TransactionResultCard({
  title,
  data,
}: {
  title: string;
  data: unknown;
}) {
  if (!data || typeof data !== "object") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{formatValue(data)}</p>
        </CardContent>
      </Card>
    );
  }

  const record = data as Record<string, unknown>;
  const status =
    (record.status as string | undefined) ??
    (record.transaction_status as string | undefined) ??
    (record.state as string | undefined);

  const entries = flattenEntries(record).filter(
    ([key]) => !["metadata", "raw"].includes(key),
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">{title}</CardTitle>
        {status && <Badge variant="outline">{status}</Badge>}
      </CardHeader>
      <CardContent>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {entries.slice(0, 12).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs capitalize">
                {key.replace(/([A-Z])/g, " $1").replace(/[._]/g, " ")}
              </dt>
              <dd className="font-medium break-all">{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
