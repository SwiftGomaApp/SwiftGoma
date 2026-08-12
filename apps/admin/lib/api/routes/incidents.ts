import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";

export type IncidentSeverity = "MINOR" | "MAJOR" | "CRITICAL";
export type IncidentStatus =
  | "INVESTIGATING"
  | "IDENTIFIED"
  | "MONITORING"
  | "RESOLVED";

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}
export interface IncidentsResponse {
  incidents: Incident[];
  overallStatus: "operational" | "degraded";
  severity: IncidentSeverity | null;
}

export async function listIncidents(): Promise<IncidentsResponse> {
  const res = await apiClient.get("/incidents");
  return unwrap(res);
}

export async function createIncident(input: {
  title: string;
  description: string;
  severity?: IncidentSeverity;
}): Promise<Incident> {
  const res = await apiClient.post("/incidents", input);
  return unwrap(res);
}

export async function updateIncident(
  id: string,
  input: Partial<{
    status: IncidentStatus;
    description: string;
    severity: IncidentSeverity;
  }>,
): Promise<Incident> {
  const res = await apiClient.patch(`/incidents/${id}`, input);
  return unwrap(res);
}
