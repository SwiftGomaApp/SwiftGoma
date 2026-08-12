"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminSubscription,
  type AdminSubscriptionDetail,
} from "@/lib/api/routes/subscriptions";
import { getErrorMessage } from "@/lib/get-error-message";
import { formatDate, formatDateTime } from "@/lib/i18n/format";
import { labelOf, subscriptionStatusLabels } from "@/lib/i18n/labels";
import { ui } from "@/lib/i18n/common";

const paymentStatusLabels: Record<string, string> = {
  SUCCEEDED: "Réussi",
  PENDING: "En attente",
  FAILED: "Échoué",
};

export default function SubscriptionDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [subscription, setSubscription] = useState<AdminSubscriptionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAdminSubscription(id);
        if (!cancelled) setSubscription(data);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Impossible de charger l'abonnement."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="w-fit"
          render={<Link href="/subscriptions" />}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <p className="text-destructive text-sm">{error ?? "Abonnement introuvable."}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            className="mb-2 -ml-2"
            render={<Link href="/subscriptions" />}
          >
            <ArrowLeft className="h-4 w-4" />
            Abonnements
          </Button>
          <h1 className="text-xl font-bold">{subscription.sellerProfile.businessName}</h1>
          <p className="text-muted-foreground text-sm">
            {subscription.plan.name} · {subscription.billingCycle} · {subscription.currency}
          </p>
        </div>
        <Badge variant="outline">
          {labelOf(subscriptionStatusLabels, subscription.status)}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Période en cours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Début :</span>{" "}
              {formatDate(subscription.currentPeriodStart)}
            </p>
            <p>
              <span className="text-muted-foreground">Fin :</span>{" "}
              {formatDate(subscription.currentPeriodEnd)}
            </p>
            <p>
              <span className="text-muted-foreground">Renouvellement auto :</span>{" "}
              {subscription.autoRenew ? "Oui" : "Non"}
            </p>
            {subscription.canceledAt && (
              <p>
                <span className="text-muted-foreground">Annulé le :</span>{" "}
                {formatDateTime(subscription.canceledAt)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vendeur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{subscription.sellerProfile.user.name}</p>
            <p className="text-muted-foreground">{subscription.sellerProfile.user.email}</p>
            {subscription.sellerProfile.user.phone && (
              <p className="text-muted-foreground">{subscription.sellerProfile.user.phone}</p>
            )}
            {subscription.renewalPhoneNumber && (
              <p>
                <span className="text-muted-foreground">Tél. renouvellement :</span>{" "}
                +{subscription.renewalPhoneNumber}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Historique des paiements ({subscription.payments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscription.payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun paiement enregistré.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Forfait</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>{ui.status}</TableHead>
                  <TableHead>Dépôt</TableHead>
                  <TableHead>Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscription.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {formatDateTime(payment.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">{payment.plan.name}</TableCell>
                    <TableCell className="text-sm">
                      {payment.amount} {payment.currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "SUCCEEDED" ? "default" : "secondary"}>
                        {labelOf(paymentStatusLabels, payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.depositId || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {payment.invoices.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                          >
                            {doc.documentNumber}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                        {payment.invoices.length === 0 && (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
