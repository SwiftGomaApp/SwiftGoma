"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { listNotifications } from "@/lib/api/routes/notifications.routes";
import type { AppNotification } from "@/lib/api/routes/notifications.routes";
import { useAuth } from "@/lib/auth/auth-context";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { toast } from "@/components/ui/toast";
import { getNotificationLink } from "@/lib/notifications/notification-link";
import { playNotificationSound } from "./notification-sound";

interface NotificationsContextValue {
  unreadCount: number;
  refresh: () => Promise<void>;
  setUnreadCount: (count: number) => void;
}

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const result = await listNotifications({ limit: 1 });
      setUnreadCount(result.unreadCount);
    } catch {
      // keep the last known count on failure
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    const socket = getSocket();
    socket.connect();

    function handleNewNotification(payload: AppNotification) {
      setUnreadCount((count) => count + 1);
      playNotificationSound();

      const link = getNotificationLink(payload);

      toast.add({
        title: payload.title,
        description: payload.body,
        type: "info",
        actionProps: link
          ? { children: "View", onClick: () => router.push(link) }
          : undefined,
      });
    }

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [isAuthenticated, router]);

  const value = useMemo(
    () => ({ unreadCount, refresh, setUnreadCount }),
    [unreadCount, refresh],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return ctx;
}
