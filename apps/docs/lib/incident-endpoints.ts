import type { EndpointDoc } from "@/lib/types";

const BASE = "/api/v1/incidents";

const sampleIncident = {
  id: "inc_1a2b3c",
  title: "Retards de livraison à Goma",
  description: "Certains livreurs rencontrent des retards liés aux conditions de circulation.",
  severity: "MINOR",
  status: "INVESTIGATING",
  resolvedAt: null,
  createdAt: "2026-02-15T08:00:00.000Z",
  updatedAt: "2026-02-15T08:00:00.000Z",
};

export const INCIDENT_GROUPS = ["Incidents"] as const;

export const incidentEndpoints: EndpointDoc[] = [
  {
    slug: "list-incidents",
    method: "GET",
    path: BASE,
    title: "List incidents",
    group: "Incidents",
    auth: "none",
    rateLimit: "Public",
    description: "Lists incidents, most recent first — powers a public status page. No authentication required.",
    queryParams: [{ name: "limit", type: "number", required: false, description: "Max 200. Defaults to 50." }],
    successStatus: 200,
    responseExample: { success: true, data: [sampleIncident] },
  },
  {
    slug: "create-incident",
    method: "POST",
    path: BASE,
    title: "Create incident",
    group: "Incidents",
    auth: "bearer",
    roles: ["ADMIN", "SUPPORT"],
    rateLimit: "Authenticated action",
    description: "Opens a new incident and broadcasts a notification about it. Staff-only.",
    bodyParams: [
      { name: "title", type: "string", required: true, description: "Up to 200 characters." },
      { name: "description", type: "string", required: true, description: "Up to 5000 characters." },
      { name: "severity", type: "string", required: false, description: "MINOR, MAJOR, or CRITICAL. Defaults to MINOR." },
    ],
    successStatus: 201,
    responseExample: { success: true, data: sampleIncident },
  },
  {
    slug: "update-incident",
    method: "PATCH",
    path: `${BASE}/:id`,
    title: "Update incident",
    group: "Incidents",
    auth: "bearer",
    roles: ["ADMIN", "SUPPORT"],
    rateLimit: "Authenticated action",
    description: "Updates an incident's description or severity. To change only the status, use the dedicated status endpoint instead — it's the one that triggers a notification.",
    pathParams: [{ name: "id", type: "string", required: true, description: "Incident ID." }],
    bodyParams: [
      { name: "description", type: "string", required: false, description: "Up to 5000 characters." },
      { name: "severity", type: "string", required: false, description: "MINOR, MAJOR, or CRITICAL." },
      { name: "status", type: "string", required: false, description: "Also accepted here, but prefer PATCH /:id/status." },
    ],
    successStatus: 200,
    responseExample: { success: true, data: sampleIncident },
  },
  {
    slug: "update-incident-status",
    method: "PATCH",
    path: `${BASE}/:id/status`,
    title: "Update incident status",
    group: "Incidents",
    auth: "bearer",
    roles: ["ADMIN", "SUPPORT"],
    rateLimit: "Authenticated action",
    description: "Changes an incident's status and broadcasts a notification about the change. Staff-only.",
    pathParams: [{ name: "id", type: "string", required: true, description: "Incident ID." }],
    bodyParams: [{ name: "status", type: "string", required: true, description: "INVESTIGATING, IDENTIFIED, MONITORING, or RESOLVED." }],
    successStatus: 200,
    responseExample: { success: true, data: { ...sampleIncident, status: "RESOLVED", resolvedAt: "2026-02-15T14:00:00.000Z" } },
    notes: ["Setting status to RESOLVED stamps resolvedAt; moving it back off RESOLVED clears that timestamp."],
  },
];
