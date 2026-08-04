import { api } from "../client";

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type NotificationPreference = {
  id: string;
  userId: string;
  type: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  updatedAt: string;
};

export type UpdatePreferenceInput = {
  type: string;
  inApp?: boolean;
  email?: boolean;
  sms?: boolean;
  push?: boolean;
};

function unwrap<T>(promise: Promise<{ data: { data: T } }>) {
  return promise.then((res) => res.data.data);
}

export const notificationsApi = {
  list(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
    return unwrap<NotificationListResponse>(
      api.get("/notifications", {
        params: {
          page: params.page,
          limit: params.limit,
          unreadOnly: params.unreadOnly ? "true" : undefined,
        },
      }),
    );
  },

  markAsRead(id: string) {
    return unwrap<Notification>(api.post(`/notifications/${id}/read`));
  },

  markAllAsRead() {
    return unwrap<{ count: number }>(api.post("/notifications/read-all"));
  },

  remove(id: string) {
    return unwrap<{ success: boolean }>(api.delete(`/notifications/${id}`));
  },

  getPreferences() {
    return unwrap<NotificationPreference[]>(
      api.get("/notifications/preferences"),
    );
  },

  updatePreference(input: UpdatePreferenceInput) {
    return unwrap<NotificationPreference>(
      api.put("/notifications/preferences", input),
    );
  },
};
