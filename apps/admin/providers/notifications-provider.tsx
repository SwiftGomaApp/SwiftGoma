"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { listNotifications, type Notification } from "@/lib/api/routes/notifications";
import { useAuth } from "@/providers/auth-provider";

type NotificationsContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  prependNotification: (notification: Notification) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const result = await listNotifications({ limit: 1 });
      setUnreadCount(result.unreadCount);
    } catch {
      // ignore — header badge is best-effort
    }
  }, [user]);

  const prependNotification = useCallback((notification: Notification) => {
    if (!notification.isRead) {
      setUnreadCount((count) => count + 1);
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    function handleNewNotification(event: Event) {
      const notification = (event as CustomEvent<Notification>).detail;
      if (notification) prependNotification(notification);
    }

    window.addEventListener("notification:new", handleNewNotification);
    return () =>
      window.removeEventListener("notification:new", handleNewNotification);
  }, [prependNotification]);

  return (
    <NotificationsContext.Provider
      value={{ unreadCount, refreshUnreadCount, prependNotification }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
