"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { getPawaPayActiveConfiguration } from "@/lib/api/routes/payments";
import { getErrorMessage } from "@/lib/get-error-message";
import { PawaPayConfigView } from "@/components/admin/pawapay-config-view";
import {
  DRC_PAWAPAY_COUNTRY,
  type PawaPayActiveConfig,
} from "@/lib/pawapay-config";
import { filterDrcCurrencies } from "@/lib/drc-payments";
import { ui } from "@/lib/i18n/common";

const OPERATIONS = ["", "DEPOSIT", "PAYOUT", "REFUND"];

const operationTypeLabels: Record<string, string> = {
  DEPOSIT: "Dépôt",
  PAYOUT: "Paiement sortant",
  REFUND: "Remboursement",
};

export default function ActiveConfigurationPage() {
  const [config, setConfig] = useState<PawaPayActiveConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState(DRC_PAWAPAY_COUNTRY);
  const [currency, setCurrency] = useState("");
  const [operationType, setOperationType] = useState("");

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPawaPayActiveConfiguration({
        country: country || DRC_PAWAPAY_COUNTRY,
        currency: currency || undefined,
        operationType: operationType || undefined,
      });
      const raw = data as PawaPayActiveConfig;
      setConfig({
        countries: (raw.countries ?? [])
          .filter((c) => c.country === DRC_PAWAPAY_COUNTRY)
          .map((c) => ({
            ...c,
            providers: (c.providers ?? []).map((p) => ({
              ...p,
              currencies: (p.currencies ?? []).filter((cur) =>
                filterDrcCurrencies([cur.currency]).length > 0,
              ),
            })),
          })),
      });
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger la configuration active."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Configuration active</h1>
        <p className="text-muted-foreground text-sm">
          Matrice des fournisseurs PawaPay en direct pour la RDC (COD) — CDF et USD uniquement.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <Input
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            placeholder="Pays (COD)"
            className="w-36"
            maxLength={3}
            readOnly
            disabled
          />
          <NativeSelect
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-36"
          >
            <NativeSelectOption value="">Toutes (CDF et USD)</NativeSelectOption>
            <NativeSelectOption value="CDF">CDF</NativeSelectOption>
            <NativeSelectOption value="USD">USD</NativeSelectOption>
          </NativeSelect>
          <NativeSelect
            value={operationType}
            onChange={(e) => setOperationType(e.target.value)}
            className="w-40"
          >
            {OPERATIONS.map((op) => (
              <NativeSelectOption key={op || "all"} value={op}>
                {op ? operationTypeLabels[op] : "Toutes les opérations"}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button variant="outline" onClick={load} disabled={isLoading}>
            {ui.apply}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <PawaPayConfigView config={config ?? { countries: [] }} />
      )}
    </div>
  );
}
