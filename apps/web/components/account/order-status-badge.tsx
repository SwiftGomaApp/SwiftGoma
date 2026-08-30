import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/orders";
import type { Locale } from "@/lib/language";

const LABELS: Record<Locale, Record<OrderStatus, string>> = {
  en: {
    AWAITING_PAYMENT: "Awaiting payment",
    PENDING_SELLER_REVIEW: "Pending review",
    ACCEPTED: "Accepted",
    PREPARING: "Preparing",
    READY_FOR_PICKUP: "Ready for pickup",
    RIDER_ASSIGNED: "Rider assigned",
    PICKED_UP: "Picked up",
    ON_THE_WAY: "On the way",
    DELIVERED: "Delivered",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
    FAILED: "Failed",
  },
  fr: {
    AWAITING_PAYMENT: "En attente de paiement",
    PENDING_SELLER_REVIEW: "En attente de validation",
    ACCEPTED: "Acceptée",
    PREPARING: "En préparation",
    READY_FOR_PICKUP: "Prête pour retrait",
    RIDER_ASSIGNED: "Livreur assigné",
    PICKED_UP: "Récupérée",
    ON_THE_WAY: "En route",
    DELIVERED: "Livrée",
    COMPLETED: "Terminée",
    REJECTED: "Refusée",
    CANCELLED: "Annulée",
    EXPIRED: "Expirée",
    FAILED: "Échouée",
  },
};

const STYLES: Record<OrderStatus, string> = {
  AWAITING_PAYMENT:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PENDING_SELLER_REVIEW:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ACCEPTED:
    "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PREPARING:
    "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  READY_FOR_PICKUP:
    "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  RIDER_ASSIGNED:
    "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PICKED_UP:
    "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ON_THE_WAY:
    "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  DELIVERED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  COMPLETED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  REJECTED: "border-destructive/30 bg-destructive/10 text-destructive",
  CANCELLED: "border-border bg-muted text-muted-foreground",
  EXPIRED: "border-border bg-muted text-muted-foreground",
  FAILED: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function OrderStatusBadge({
  status,
  locale,
}: {
  status: OrderStatus;
  locale: Locale;
}) {
  return (
    <Badge variant="outline" className={STYLES[status]}>
      {LABELS[locale][status]}
    </Badge>
  );
}

export default OrderStatusBadge;
