"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ui } from "@/lib/i18n/common";
import type { PawaPayActiveConfig } from "@/lib/pawapay-config";

function statusVariant(status?: string) {
  if (!status) return "secondary" as const;
  if (status.toLowerCase().includes("active")) return "default" as const;
  return "outline" as const;
}

function translateStatus(status?: string): string {
  if (!status) return "inconnu";
  if (status.toLowerCase().includes("active")) return "actif";
  return status;
}

export function PawaPayConfigView({ config }: { config: PawaPayActiveConfig }) {
  const countries = config.countries ?? [];

  if (countries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune configuration active retournée.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {countries.map((country) => (
        <Card key={country.country}>
          <CardHeader>
            <CardTitle className="text-sm">{country.country}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Devise</TableHead>
                  <TableHead>Opération</TableHead>
                  <TableHead>{ui.status}</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Max</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(country.providers ?? []).flatMap((provider) =>
                  (provider.currencies ?? []).flatMap((currency) => {
                    const ops = currency.operationTypes ?? {};
                    return Object.entries(ops).map(([operation, details]) => (
                      <TableRow
                        key={`${country.country}-${provider.provider}-${currency.currency}-${operation}`}
                      >
                        <TableCell className="font-medium">
                          {provider.provider}
                        </TableCell>
                        <TableCell>{currency.currency}</TableCell>
                        <TableCell>{operation}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(details.status)}>
                            {translateStatus(details.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{details.minAmount ?? "—"}</TableCell>
                        <TableCell>{details.maxAmount ?? "—"}</TableCell>
                      </TableRow>
                    ));
                  }),
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
