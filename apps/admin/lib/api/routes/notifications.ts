import { apiClient } from "@/lib/api/client";
import { unwrap, toQueryString, type Paginated } from "@/lib/api/utils";

export type NotificationType =
  | "ORDER_STATUS"
  | "PAYMENT"
  | "ACCOUNT_SECURITY"
  | "PROMO"
  | "SELLER_ONBOARDING"
  | "SUPPORT"
  | "SYSTEM";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: unknown;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse extends Paginated {
  notifications: Notification[];
  unreadCount: number;
}

export async function listNotifications(
  params: { page?: number; limit?: number; unreadOnly?: boolean; type?: NotificationType } = {},
): Promise<NotificationListResponse> {
  const res = await apiClient.get(
    `/notifications${toQueryString({
      page: params.page,
      limit: params.limit,
      unreadOnly: params.unreadOnly ? "true" : undefined,
      type: params.type,
    })}`,
  );
  return unwrap(res);
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const res = await apiClient.post(`/notifications/${id}/read`);
  return unwrap(res);
}

export async function markAllNotificationsRead(): Promise<{ updatedCount: number }> {
  const res = await apiClient.post("/notifications/read-all");
  return unwrap(res);
}

export async function deleteNotification(
  id: string,
): Promise<{ id: string; deleted: boolean }> {
  const res = await apiClient.delete(`/notifications/${id}`);
  return unwrap(res);
}

export async function sendNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: unknown;
}): Promise<Notification> {
  const res = await apiClient.post("/notifications", input);
  return unwrap(res);
}
