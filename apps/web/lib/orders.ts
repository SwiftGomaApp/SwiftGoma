import type { OrderStatus } from "@/lib/api/routes/orders";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "En attente de paiement",
  PENDING_SELLER_REVIEW: "En attente du vendeur",
  ACCEPTED: "Acceptée",
  PREPARING: "En préparation",
  READY_FOR_PICKUP: "Prête pour retrait",
  RIDER_ASSIGNED: "Livreur assigné",
  PICKED_UP: "Récupérée par le livreur",
  ON_THE_WAY: "En route",
  DELIVERED: "Livrée",
  COMPLETED: "Terminée",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
  EXPIRED: "Expirée",
  FAILED: "Échouée",
};

export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
  "FAILED",
];

export function orderStatusBadgeVariant(
  status: OrderStatus,
): "default" | "secondary" | "destructive" {
  if (status === "COMPLETED") return "default";
  if (TERMINAL_ORDER_STATUSES.includes(status)) return "destructive";
  return "secondary";
}

export function formatOrderPrice(price: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currency === "CDF" ? 0 : 2,
    maximumFractionDigits: currency === "CDF" ? 0 : 2,
  }).format(price);
}

export function formatOrderDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}
