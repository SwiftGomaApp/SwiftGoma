import { api } from "../client";

export type Incident = {
  id: string;
  title: string;
  description: string;
  severity: "MINOR" | "MAJOR" | "CRITICAL";
  status: "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type IncidentsResponse = {
  incidents: Incident[];
  overallStatus: "operational" | "degraded";
  severity: Incident["severity"] | null;
};

function unwrap<T>(promise: Promise<{ data: { data: T } }>) {
  return promise.then((res) => res.data.data);
}

export const incidentsApi = {
  list() {
    return unwrap<IncidentsResponse>(api.get("/incidents"));
  },
};
