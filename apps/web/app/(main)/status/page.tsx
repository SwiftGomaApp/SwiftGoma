import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { incidentsApi, type Incident } from "@/lib/api/routes/incidents";
import { Badge } from "@/components/ui/badge";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Statut du système",
  description:
    "État des services SwiftGoma, incidents en cours et disponibilité de la plateforme.",
  path: "/status",
});

const SEVERITY_LABEL: Record<Incident["severity"], string> = {
  MINOR: "Mineur",
  MAJOR: "Majeur",
  CRITICAL: "Critique",
};

const STATUS_LABEL: Record<Incident["status"], string> = {
  INVESTIGATING: "Investigation en cours",
  IDENTIFIED: "Cause identifiée",
  MONITORING: "Sous surveillance",
  RESOLVED: "Résolu",
};

const SEVERITY_VARIANT: Record<Incident["severity"], "secondary" | "destructive"> = {
  MINOR: "secondary",
  MAJOR: "destructive",
  CRITICAL: "destructive",
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default async function StatusPage() {
  let incidents: Incident[] = [];
  let overallStatus: "operational" | "degraded" = "operational";

  try {
    const result = await incidentsApi.list();
    incidents = result.incidents;
    overallStatus = result.overallStatus;
  } catch (err) {
    console.warn("[StatusPage] Failed to load incidents:", (err as Error).message);
  }

  const isOperational = overallStatus === "operational";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Statut du système
        </h1>
        <div
          className={
            isOperational
              ? "flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"
              : "flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400"
          }
        >
          {isOperational ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {isOperational
            ? "Tous les systèmes sont opérationnels"
            : "Certains services rencontrent des perturbations"}
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">
          Historique des incidents
        </h2>

        {incidents.length === 0 ? (
          <p className="rounded-lg border border-border py-10 text-center text-sm text-muted-foreground">
            Aucun incident signalé.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {incidents.map((incident) => (
              <div key={incident.id} className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">
                    {incident.title}
                  </h3>
                  <Badge variant={SEVERITY_VARIANT[incident.severity]}>
                    {SEVERITY_LABEL[incident.severity]}
                  </Badge>
                  <Badge variant="outline">{STATUS_LABEL[incident.status]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {incident.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {incident.status === "RESOLVED" && incident.resolvedAt
                    ? `Résolu le ${formatDate(incident.resolvedAt)}`
                    : `Signalé le ${formatDate(incident.createdAt)}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
