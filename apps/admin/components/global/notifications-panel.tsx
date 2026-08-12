"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type Notification,
} from "@/lib/api/routes/notifications";
import { useNotifications } from "@/providers/notifications-provider";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/i18n/format";
import { ui } from "@/lib/i18n/common";
import { labelOf, notificationTypeLabels } from "@/lib/i18n/labels";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export function NotificationsPanel() {
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadNotifications() {
    setIsLoading(true);
    try {
      const result = await listNotifications({ limit: 20 });
      setNotifications(result.notifications);
      await refreshUnreadCount();
    } catch (err) {
      showErrorToast(
        "Impossible de charger les notifications",
        getErrorMessage(err, ""),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function handleNewNotification(event: Event) {
      const notification = (event as CustomEvent<Notification>).detail;
      if (!notification) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, 20);
      });
      if (open) refreshUnreadCount();
    }

    window.addEventListener("notification:new", handleNewNotification);
    return () =>
      window.removeEventListener("notification:new", handleNewNotification);
  }, [open, refreshUnreadCount]);

  async function handleMarkRead(id: string) {
    setBusyId(id);
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      await refreshUnreadCount();
    } catch (err) {
      showErrorToast(
        "Impossible de marquer comme lu",
        getErrorMessage(err, ""),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await refreshUnreadCount();
      showSuccessToast("Toutes les notifications ont été marquées comme lues");
    } catch (err) {
      showErrorToast(
        "Impossible de tout marquer comme lu",
        getErrorMessage(err, ""),
      );
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await refreshUnreadCount();
    } catch (err) {
      showErrorToast(
        "Impossible de supprimer la notification",
        getErrorMessage(err, ""),
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          />
        }
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" side="bottom" className="w-96 p-0">
        <PopoverHeader className="flex-row items-center justify-between border-b px-4 py-3">
          <PopoverTitle>Notifications</PopoverTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              <Check className="mr-1 h-3.5 w-3.5" />
              {ui.markAllRead}
            </Button>
          )}
        </PopoverHeader>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <Bell className="text-muted-foreground h-7 w-7" />
              <p className="text-sm font-medium">Aucune notification</p>
              <p className="text-muted-foreground text-xs">
                Les mises à jour en temps réel s&apos;affichent ici lorsque
                vous êtes connecté.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    "flex gap-2 px-4 py-3",
                    !notification.isRead && "bg-primary/5",
                  )}
                >
                  {!notification.isRead && (
                    <span className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                  )}
                  <div className={cn("min-w-0 flex-1", notification.isRead && "pl-4")}>
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {notification.title}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {labelOf(notificationTypeLabels, notification.type)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                      {notification.body}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[10px]">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={busyId === notification.id}
                        onClick={() => handleMarkRead(notification.id)}
                        aria-label={ui.markRead}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={busyId === notification.id}
                      onClick={() => handleDelete(notification.id)}
                      aria-label={ui.delete}
                    >
                      {busyId === notification.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t px-4 py-2">
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            nativeButton={false}
            render={<Link href="/notifications" />}
          >
            Voir toutes les notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
