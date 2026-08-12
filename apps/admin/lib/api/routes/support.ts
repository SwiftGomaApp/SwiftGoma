import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";

export type ContactMessageSubject =
  | "general"
  | "account"
  | "order"
  | "payment"
  | "seller"
  | "delivery"
  | "privacy"
  | "other";

export type ContactMessageStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: ContactMessageSubject;
  subjectLabel: string;
  message: string;
  status: ContactMessageStatus;
  isRead: boolean;
  readAt: string | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; role: string } | null;
  assignedAt: string | null;
  closedAt: string | null;
  internalNote: string | null;
  createdAt: string;
}

export interface ContactMessageListResponse {
  items: ContactMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const contactSubjectLabels: Record<ContactMessageSubject, string> = {
  general: "Question générale",
  account: "Compte et connexion",
  order: "Commande",
  payment: "Paiement / Retrait",
  seller: "Compte Vendeur",
  delivery: "Livraison",
  privacy: "Confidentialité / Données personnelles",
  other: "Autre",
};

export const contactMessageStatusLabels: Record<ContactMessageStatus, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  CLOSED: "Clôturé",
};

export async function listContactMessages(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    subject?: ContactMessageSubject;
    status?: ContactMessageStatus;
    unread?: boolean;
  } = {},
): Promise<ContactMessageListResponse> {
  const res = await apiClient.get("/support/messages", {
    params: {
      ...params,
      unread: params.unread ? "true" : undefined,
    },
  });
  return unwrap(res);
}

export async function getContactMessage(id: string): Promise<ContactMessage> {
  const res = await apiClient.get(`/support/messages/${id}`);
  return unwrap(res);
}

export async function updateContactMessage(
  id: string,
  input: Partial<{
    status: ContactMessageStatus;
    isRead: boolean;
    internalNote: string;
    assignedToId: string | null;
  }>,
): Promise<ContactMessage> {
  const res = await apiClient.patch(`/support/messages/${id}`, input);
  return unwrap(res);
}

export async function assignContactMessageToMe(
  id: string,
): Promise<ContactMessage> {
  const res = await apiClient.post(`/support/messages/${id}/assign-me`);
  return unwrap(res);
}
