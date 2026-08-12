"use client";
import { useEffect, useState } from "react";
import { Plus, AlertTriangle, CheckCircle2, Car, icons } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createIncident,
  listIncidents,
  updateIncident,
  type Incident,
  type IncidentSeverity,
  type IncidentStatus,
} from "@/lib/api/routes/incidents";
import { getErrorMessage } from "@/lib/get-error-message";
import { formatDateTime } from "@/lib/i18n/format";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ui } from "@/lib/i18n/common";
const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  MINOR: "Mineur",
  MAJOR: "Majeur",
  CRITICAL: "Critique",
};
const STATUS_LABELS: Record<IncidentStatus, string> = {
  INVESTIGATING: "Investigation en cours",
  IDENTIFIED: "Cause identifiée",
  MONITORING: "Sous surveillance",
  RESOLVED: "Résolu",
};
const SEVERITY_VARIANTS: Record<
  IncidentSeverity,
  "secondary" | "destructive" | "outline"
> = {
  MINOR: "secondary",
  MAJOR: "destructive",
  CRITICAL: "destructive",
};
const emptyCreateForm = {
  title: "",
  description: "",
  severity: "MINOR" as IncidentSeverity,
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [overallStatus, setOverallStatus] = useState<
    "operational" | "degraded"
  >("operational");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [isCreating, setIsCreating] = useState(false);

  const [editIncident, setEditIncident] = useState<Incident | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    severity: "MINOR" as IncidentSeverity,
    status: "INVESTIGATING" as IncidentStatus,
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listIncidents();
      setIncidents(data.incidents);
      setOverallStatus(data.overallStatus);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les incidents."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createIncident({
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        severity: createForm.severity,
      });
      setCreateForm(emptyCreateForm);
      setCreateOpen(false);
      await load();
      showSuccessToast(
        "Incident créé",
        "Une notification système a été envoyée.",
      );
    } catch (err) {
      showErrorToast(
        "Échec",
        getErrorMessage(err, "Impossible de créer l'incident."),
      );
    } finally {
      setIsCreating(false);
    }
  }

  function openEdit(incident: Incident) {
    setEditIncident(incident);
    setEditForm({
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editIncident) return;
    setIsSavingEdit(true);
    try {
      await updateIncident(editIncident.id, editForm);
      setEditIncident(null);
      await load();
      showSuccessToast("Incident mis à jour", editIncident.title);
    } catch (err) {
      showErrorToast(
        "Échec",
        getErrorMessage(err, "Impossible de mettre à jour."),
      );
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function quickStatusChange(incident: Incident, status: IncidentStatus) {
    if (incident.status === status) return;
    setBusyId(incident.id);
    try {
      await updateIncident(incident.id, { status });
      await load();
      showSuccessToast("Statut mis à jour", STATUS_LABELS[status]);
    } catch (err) {
      showErrorToast(
        "Échec",
        getErrorMessage(err, "Impossible de changer le statut."),
      );
    } finally {
      setBusyId(null);
    }
  }
  const isOperational = overallStatus === "operational";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Incidents système</h1>
          <p className="text-muted-foreground text-sm">
            Signalez et suivez les perturbations affichées sur la page statut
            publique.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvel incident
        </Button>
      </div>
      <Card
        className={
          isOperational
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-amber-500/30 bg-amber-500/5"
        }
      >
        <CardContent className="flex items-center gap-3 pt-6">
          {isOperational ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          <p className="text-sm font-medium">
            {isOperational
              ? "Tous les systèmes sont opérationnels"
              : "Des incidents actifs affectent la plateforme"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Historique</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && <p className="text-destructive text-sm">{error}</p>}

          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : incidents.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun incident signalé.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div className="max-w-55">
                        <p className="truncate text-sm font-medium">
                          {incident.title}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {incident.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={SEVERITY_VARIANTS[incident.severity]}>
                        {SEVERITY_LABELS[incident.severity]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <NativeSelect
                        value={incident.status}
                        onChange={(e) =>
                          quickStatusChange(
                            incident,
                            e.target.value as IncidentStatus,
                          )
                        }
                        className="w-44"
                        disabled={busyId === incident.id}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <NativeSelectOption key={value} value={value}>
                            {label}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(incident.createdAt)}
                      {incident.resolvedAt && (
                        <div className="text-muted-foreground text-xs">
                          Résolu {formatDateTime(incident.resolvedAt)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(incident)}
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Signaler un incident</DialogTitle>
            <DialogDescription>
              L&apos;incident sera visible sur la page statut publique et une
              notification système sera envoyée.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <FieldGroup className="gap-4 py-2">
              <Field>
                <FieldLabel>Titre</FieldLabel>
                <Input
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="ex. Paiements Mobile Money indisponibles"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Décrivez l'impact et les actions en cours…"
                  rows={4}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Sévérité</FieldLabel>
                <NativeSelect
                  value={createForm.severity}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      severity: e.target.value as IncidentSeverity,
                    }))
                  }
                >
                  {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                    <NativeSelectOption key={value} value={value}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                {ui.cancel}
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Création…" : "Créer l'incident"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editIncident !== null}
        onOpenChange={(open) => {
          if (!open) setEditIncident(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;incident</DialogTitle>
            <DialogDescription>{editIncident?.title}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit}>
            <FieldGroup className="gap-4 py-2">
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={4}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Sévérité</FieldLabel>
                <NativeSelect
                  value={editForm.severity}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      severity: e.target.value as IncidentSeverity,
                    }))
                  }
                >
                  {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                    <NativeSelectOption key={value} value={value}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel>Statut</FieldLabel>
                <NativeSelect
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      status: e.target.value as IncidentStatus,
                    }))
                  }
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <NativeSelectOption key={value} value={value}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditIncident(null)}
              >
                {ui.cancel}
              </Button>
              <Button type="submit" disabled={isSavingEdit}>
                {isSavingEdit ? "Enregistrement…" : ui.apply}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
