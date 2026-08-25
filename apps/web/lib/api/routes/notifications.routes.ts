import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";

export const NOTIFICATION_TYPES = [
  "ORDER_STATUS",
  "ORDER_MESSAGE",
  "PAYMENT",
  "ACCOUNT_SECURITY",
  "PROMO",
  "SELLER_ONBOARDING",
  "SUPPORT",
  "SYSTEM",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const FORCED_NOTIFICATION_TYPES: NotificationType[] = [
  "ACCOUNT_SECURITY",
];

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListParams = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
};

export type NotificationListResult = {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type NotificationPreference = {
  type: NotificationType;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
};

export function listNotifications(params: NotificationListParams = {}) {
  return apiGet<NotificationListResult>("/notifications", {
    params: {
      page: params.page,
      limit: params.limit,
      unreadOnly: params.unreadOnly ? "true" : undefined,
      type: params.type,
    },
  });
}

export function markNotificationRead(id: string) {
  return apiPost<AppNotification>(`/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return apiPost<{ updatedCount: number }>("/notifications/read-all");
}

export function deleteNotification(id: string) {
  return apiDelete<{ id: string; deleted: boolean }>(`/notifications/${id}`);
}

export function getNotificationPreferences() {
  return apiGet<NotificationPreference[]>("/notifications/preferences");
}

export function updateNotificationPreference(body: {
  type: NotificationType;
  inApp?: boolean;
  email?: boolean;
  sms?: boolean;
  push?: boolean;
}) {
  return apiPut<NotificationPreference>("/notifications/preferences", body);
}
