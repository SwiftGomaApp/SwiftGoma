/** Affiche une étiquette lisible pour les valeurs d'énumération affichées dans l'UI. */

export function labelEnum(value: string): string {
  return value.replaceAll("_", " ");
}

export const kycStatusLabels: Record<string, string> = {
  PENDING: "En attente",
  SUPPORT_REVIEWED: "Revu par le support",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
};

export const sellerProfileStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
};

export const shopStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  SUSPENDED: "Suspendu",
};

export const userRoleLabels: Record<string, string> = {
  BUYER: "Acheteur",
  SELLER: "Vendeur",
  RIDER: "Livreur",
  ADMIN: "Administrateur",
  SUPPORT: "Support",
  ACCOUNTANT: "Comptable",
};

export const notificationTypeLabels: Record<string, string> = {
  ORDER_STATUS: "Statut de commande",
  PAYMENT: "Paiement",
  ACCOUNT_SECURITY: "Sécurité du compte",
  PROMO: "Promotion",
  SELLER_ONBOARDING: "Inscription vendeur",
  SUPPORT: "Support",
  SYSTEM: "Système",
};

export const idDocumentTypeLabels: Record<string, string> = {
  NATIONAL_ID: "Carte d'identité",
  PASSPORT: "Passeport",
  DRIVERS_LICENSE: "Permis de conduire",
};

export const blogStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
};

export const subscriptionStatusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  PENDING: "Paiement en attente",
  PAST_DUE: "En retard",
  FAILED: "Échec de paiement",
  EXPIRED: "Expiré",
  CANCELED: "Annulé",
};

export const billingPeriodLabels: Record<string, string> = {
  MONTHLY: "Mensuel",
  YEARLY: "Annuel",
};

export const orderStatusLabels: Record<string, string> = {
  AWAITING_PAYMENT: "Paiement en attente",
  PENDING_SELLER_REVIEW: "En attente vendeur",
  ACCEPTED: "Acceptée",
  PREPARING: "En préparation",
  READY_FOR_PICKUP: "Prête (retrait)",
  RIDER_ASSIGNED: "Livreur assigné",
  PICKED_UP: "Récupérée",
  ON_THE_WAY: "En route",
  DELIVERED: "Livrée",
  COMPLETED: "Terminée",
  REJECTED: "Rejetée",
  CANCELLED: "Annulée",
  EXPIRED: "Expirée",
  FAILED: "Échouée",
};

export const productStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

export function labelOf(
  map: Record<string, string>,
  value: string,
): string {
  return map[value] ?? labelEnum(value);
}
