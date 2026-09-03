"use client";

import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  getDeliveryRateConfig,
  upsertDeliveryRateConfig,
  type DeliveryRateConfig,
} from "@/lib/api/routes/orders";
import { getErrorMessage } from "@/lib/get-error-message";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { formatDateTime } from "@/lib/i18n/format";

export default function DeliveryRatePage() {
  const [config, setConfig] = useState<DeliveryRateConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [perKmRate, setPerKmRate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [previewDistance, setPreviewDistance] = useState("2");

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const current = await getDeliveryRateConfig();
      setConfig(current);
      if (current) setPerKmRate(current.perKmRate);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger le tarif de livraison."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsedRate = Number(perKmRate);
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) return;

    setIsSaving(true);
    try {
      const updated = await upsertDeliveryRateConfig(parsedRate);
      setConfig(updated);
      showSuccessToast("Tarif enregistré", `${parsedRate} FC / km`);
    } catch (err) {
      showErrorToast("Impossible d'enregistrer le tarif", getErrorMessage(err, "Réessayez."));
    } finally {
      setIsSaving(false);
    }
  }

  const parsedRate = Number(perKmRate);
  const parsedDistance = Number(previewDistance);
  const previewAmount =
    Number.isFinite(parsedRate) &&
    parsedRate > 0 &&
    Number.isFinite(parsedDistance) &&
    parsedDistance >= 0
      ? Math.round(parsedDistance * 1.3 * parsedRate)
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Tarif de livraison</h1>
        <p className="text-muted-foreground text-sm">
          Tarif au km utilisé pour calculer le frais de livraison selon la distance,
          en plus du frais de base et des km inclus propres à chaque boutique.
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4" />
              {config ? "Tarif actuel" : "Aucun tarif configuré"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {config ? (
              <p className="text-muted-foreground text-sm">
                <span className="text-foreground font-semibold">
                  {config.perKmRate} FC
                </span>{" "}
                / km · mis à jour {formatDateTime(config.updatedAt)}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Tant qu'aucun tarif n'est défini, toutes les boutiques utilisent leur
                frais de livraison fixe habituel.
              </p>
            )}

            <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
              <Field>
                <FieldLabel>Tarif par km (FC)</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={perKmRate}
                  onChange={(e) => setPerKmRate(e.target.value)}
                  placeholder="ex. 120"
                  required
                  className="w-40"
                />
                <FieldDescription>
                  S'applique à toutes les boutiques, au-delà des km inclus (
                  <code>deliveryFreeKm</code>) définis par boutique.
                </FieldDescription>
              </Field>
              <Button
                type="submit"
                disabled={isSaving || !perKmRate}
                className="w-fit"
              >
                {isSaving ? "Enregistrement…" : "Enregistrer le tarif"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Aperçu du calcul</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <div className="flex flex-wrap items-end gap-2">
              <Field>
                <FieldLabel>Distance à vol d&apos;oiseau (km)</FieldLabel>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={previewDistance}
                  onChange={(e) => setPreviewDistance(e.target.value)}
                  className="w-32"
                />
              </Field>
            </div>

            {previewAmount != null ? (
              <div className="bg-muted/40 rounded-lg p-4">
                <p className="text-lg font-semibold">≈ {previewAmount} FC</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Distance ajustée (×1.3 pour approximer la route réelle) × tarif —
                  à ajouter au frais de base de la boutique, moins ses km inclus
                  éventuels.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Entrez un tarif et une distance pour voir un aperçu.
              </p>
            )}
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
