import type {
  OrderFulfillmentMethod,
  OrderStatus,
} from "@/lib/api/routes/orders";

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

export const CANCELLABLE_ORDER_STATUSES: OrderStatus[] = [
  "AWAITING_PAYMENT",
  "PENDING_SELLER_REVIEW",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "RIDER_ASSIGNED",
];

/** Live map tracking — « En livraison » step on the delivery timeline */
export const TRACKABLE_DELIVERY_STATUSES: OrderStatus[] = [
  "RIDER_ASSIGNED",
  "PICKED_UP",
  "ON_THE_WAY",
];

export function isOrderTrackable(
  status: OrderStatus,
  fulfillmentMethod: OrderFulfillmentMethod,
): boolean {
  return (
    fulfillmentMethod === "DELIVERY" &&
    TRACKABLE_DELIVERY_STATUSES.includes(status)
  );
}

export function getTrackOrderUnavailableMessage(
  status: OrderStatus,
  fulfillmentMethod: OrderFulfillmentMethod,
): string {
  if (fulfillmentMethod === "PICKUP") {
    return "Le suivi en direct sur carte est réservé aux commandes en livraison à domicile. Pour un retrait en boutique, présentez votre code QR à la remise.";
  }

  if (status === "DELIVERED" || status === "COMPLETED") {
    return "Cette commande a déjà été livrée. Le suivi en direct n'est plus disponible.";
  }

  if (isOrderTrackable(status, fulfillmentMethod)) {
    return "";
  }

  switch (status) {
    case "AWAITING_PAYMENT":
      return "Le suivi sera disponible après confirmation du paiement et le départ du livreur.";
    case "PENDING_SELLER_REVIEW":
      return "Le vendeur doit d'abord confirmer votre commande. Le suivi s'activera lorsque la livraison commencera.";
    case "ACCEPTED":
    case "PREPARING":
      return "Votre commande est encore en préparation chez le vendeur. Le suivi sur carte s'activera dès qu'un livreur sera en route.";
    default:
      return `Le suivi en direct est disponible pendant la livraison (statut actuel : ${ORDER_STATUS_LABELS[status]}).`;
  }
}

export function getCancelUnavailableMessage(status: OrderStatus): string {
  if (CANCELLABLE_ORDER_STATUSES.includes(status)) {
    return "";
  }

  switch (status) {
    case "PICKED_UP":
    case "ON_THE_WAY":
    case "DELIVERED":
      return "Votre commande est déjà en cours de livraison ou livrée. Contactez le vendeur ou le support si vous avez un problème.";
    case "COMPLETED":
      return "Cette commande est terminée et ne peut plus être annulée.";
    case "CANCELLED":
    case "REJECTED":
    case "EXPIRED":
    case "FAILED":
      return "Cette commande est déjà clôturée.";
    default:
      return `Cette commande ne peut plus être annulée (statut : ${ORDER_STATUS_LABELS[status]}).`;
  }
}

export function canCancelOrder(status: OrderStatus): boolean {
  return CANCELLABLE_ORDER_STATUSES.includes(status);
}

export const FAILED_ORDER_STATUSES: OrderStatus[] = [
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "FAILED",
];

export type OrderTimelineStep = {
  key: string;
  label: string;
  statuses: OrderStatus[];
};

const DELIVERY_TIMELINE: OrderTimelineStep[] = [
  {
    key: "payment",
    label: "Paiement confirmé",
    statuses: ["AWAITING_PAYMENT"],
  },
  {
    key: "review",
    label: "Validation vendeur",
    statuses: ["PENDING_SELLER_REVIEW"],
  },
  {
    key: "prep",
    label: "Préparation",
    statuses: ["ACCEPTED", "PREPARING"],
  },
  {
    key: "shipping",
    label: "En livraison",
    statuses: ["RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"],
  },
  {
    key: "delivered",
    label: "Livrée",
    statuses: ["DELIVERED"],
  },
  {
    key: "done",
    label: "Terminée",
    statuses: ["COMPLETED"],
  },
];

const PICKUP_TIMELINE: OrderTimelineStep[] = [
  {
    key: "payment",
    label: "Paiement confirmé",
    statuses: ["AWAITING_PAYMENT"],
  },
  {
    key: "review",
    label: "Validation vendeur",
    statuses: ["PENDING_SELLER_REVIEW"],
  },
  {
    key: "prep",
    label: "Préparation",
    statuses: ["ACCEPTED", "PREPARING"],
  },
  {
    key: "ready",
    label: "Prête au retrait",
    statuses: ["READY_FOR_PICKUP"],
  },
  {
    key: "done",
    label: "Terminée",
    statuses: ["COMPLETED"],
  },
];

export function getOrderTimeline(
  status: OrderStatus,
  fulfillmentMethod: OrderFulfillmentMethod,
) {
  const steps =
    fulfillmentMethod === "DELIVERY" ? DELIVERY_TIMELINE : PICKUP_TIMELINE;
  const currentIndex = steps.findIndex((step) =>
    step.statuses.includes(status),
  );
  return {
    steps,
    currentIndex,
    isFailed: FAILED_ORDER_STATUSES.includes(status),
  };
}

export function formatOrderReference(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

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
