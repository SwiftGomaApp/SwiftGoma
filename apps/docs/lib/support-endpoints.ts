import type { EndpointDoc } from "@/lib/types";

const BASE = "/api/v1/support";

const sampleContactMessage = {
  id: "cmsg_1a2b3c",
  name: "Aline Mapendo",
  email: "aline@example.com",
  subject: "ORDER_ISSUE",
  message: "Ma commande n'est jamais arrivée.",
  status: "OPEN",
  assignedTo: null,
  createdAt: "2026-02-15T09:00:00.000Z",
};

export const SUPPORT_GROUPS = ["Support"] as const;

export const supportEndpoints: EndpointDoc[] = [
  {
    slug: "submit-contact-message",
    method: "POST",
    path: `${BASE}/contact`,
    title: "Submit contact message",
    group: "Support",
    auth: "none",
    rateLimit: "Request/initiation",
    description: "Submits a message from the public contact form.",
    bodyParams: [
      { name: "name", type: "string", required: true, description: "" },
      { name: "email", type: "string", required: true, description: "" },
      { name: "subject", type: "string", required: true, description: "A predefined subject category." },
      { name: "message", type: "string", required: true, description: "" },
    ],
    successStatus: 201,
    responseExample: { success: true, data: sampleContactMessage },
  },
  {
    slug: "list-contact-messages",
    method: "GET",
    path: `${BASE}/messages`,
    title: "List contact messages",
    group: "Support",
    auth: "bearer",
    roles: ["ADMIN", "SUPPORT"],
    rateLimit: "Session",
    description: "Lists submitted contact messages. Staff-only.",
    queryParams: [
      { name: "page", type: "number", required: false, description: "Defaults to 1." },
      { name: "limit", type: "number", required: false, description: "Max 100. Defaults to 20." },
      { name: "status", type: "string", required: false, description: "OPEN, ASSIGNED, or CLOSED." },
    ],
    successStatus: 200,
    responseExample: {
      success: true,
      data: { messages: [sampleContactMessage], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    },
  },
  {
    slug: "get-contact-message",
    method: "GET",
    path: `${BASE}/messages/:id`,
    title: "Get contact message",
    group: "Support",
    auth: "bearer",
    roles: ["ADMIN", "SUPPORT"],
    rateLimit: "Session",
    description: "Returns one contact message's detail. Staff-only.",
    pathParams: [{ name: "id", type: "string", required: true, description: "Contact message ID." }],
    successStatus: 200,
    responseExample: { success: true, data: sampleContactMessage },
  },
  {
    slug: "update-contact-message",
    method: "PATCH",
    path: `${BASE}/messages/:id`,
    title: "Update contact message",
    group: "Support",
    auth: "bearer",
    roles: ["ADMIN", "SUPPORT"],
    rateLimit: "Authenticated action",
    description: "Updates a contact message's status, e.g. closing it once resolved. Staff-only.",
    pathParams: [{ name: "id", type: "string", required: true, description: "Contact message ID." }],
    bodyParams: [
      { name: "status", type: "string", required: false, description: "OPEN, ASSIGNED, or CLOSED." },
      { name: "notes", type: "string", required: false, description: "Internal note." },
    ],
    successStatus: 200,
    responseExample: { success: true, data: { ...sampleContactMessage, status: "CLOSED" } },
  },
  {
    slug: "assign-contact-message",
    method: "POST",
    path: `${BASE}/messages/:id/assign-me`,
    title: "Assign to me",
    group: "Support",
    auth: "bearer",
    roles: ["ADMIN", "SUPPORT"],
    rateLimit: "Authenticated action",
    description: "Claims a contact message for the signed-in staff member to handle. Staff-only.",
    pathParams: [{ name: "id", type: "string", required: true, description: "Contact message ID." }],
    successStatus: 200,
    responseExample: { success: true, data: { ...sampleContactMessage, status: "ASSIGNED", assignedTo: "9f8e7d6c" } },
  },
];
