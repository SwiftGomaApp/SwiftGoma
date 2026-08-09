"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, Check, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  notificationsApi,
  type Notification,
} from "@/lib/api/routes/notifications";
import { ApiException } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr));
}

function notificationHref(notification: Notification): string | null {
  const data = notification.data as { orderId?: string } | null;
  if (data?.orderId) return `/orders/${data.orderId}`;
  return null;
}

type NotificationsModalProps = {
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
  className?: string;
};

export function NotificationsModal({
  unreadCount,
  onUnreadCountChange,
  className,
}: NotificationsModalProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadNotifications() {
    setIsLoading(true);
    try {
      const result = await notificationsApi.list({ limit: 50 });
      setNotifications(result.notifications);
      onUnreadCountChange(result.unreadCount);
    } catch (err) {
      toast.error(
        err instanceof ApiException
          ? err.message
          : "Impossible de charger les notifications.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    function handleNewNotification() {
      onUnreadCountChange(unreadCount + 1);
      if (open) loadNotifications();
    }
    window.addEventListener("notification:new", handleNewNotification);
    return () =>
      window.removeEventListener("notification:new", handleNewNotification);
  }, [unreadCount, open]);

  useEffect(() => {
    if (open) loadNotifications();
  }, [open]);

  async function handleMarkAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    onUnreadCountChange(Math.max(0, unreadCount - 1));
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      toast.error("Impossible de marquer comme lu.");
      loadNotifications();
    }
  }

  async function handleMarkAllAsRead() {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onUnreadCountChange(0);
    try {
      await notificationsApi.markAllAsRead();
      toast.success("Toutes les notifications sont marquées comme lues.");
    } catch {
      setNotifications(previous);
      toast.error("Une erreur est survenue.");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const wasUnread = notifications.find((n) => n.id === id)?.isRead === false;
    try {
      await notificationsApi.remove(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) onUnreadCountChange(Math.max(0, unreadCount - 1));
    } catch {
      toast.error("Impossible de supprimer cette notification.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button type="button" className={className} />}>
        <Bell className="mr-2 h-4 w-4" />
        Notifications
        {unreadCount > 0 && (
          <span className="ml-auto rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
            {unreadCount}
          </span>
        )}
      </DialogTrigger>

      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-2xl">
        <DialogHeader className="flex-row items-center justify-between space-y-0">
          <DialogTitle>Notifications</DialogTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Tout marquer comme lu
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Bell className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Aucune notification
              </p>
              <p className="text-sm text-muted-foreground">
                Vous serez notifié ici des mises à jour importantes.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {notifications.map((notification) => {
                const href = notificationHref(notification);
                const content = (
                  <div
                    className={cn(
                      "flex gap-3 px-1 py-3",
                      !notification.isRead && "bg-primary/5",
                    )}
                  >
                    {!notification.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <div
                      className={cn("flex-1", notification.isRead && "pl-5")}
                    >
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {notification.body}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {!notification.isRead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleMarkAsRead(notification.id);
                          }}
                          aria-label="Marquer comme lu"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(notification.id);
                        }}
                        disabled={deletingId === notification.id}
                        aria-label="Supprimer"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                      >
                        {deletingId === notification.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );

                return (
                  <li key={notification.id}>
                    {href ? (
                      <Link
                        href={href}
                        onClick={() => {
                          if (!notification.isRead)
                            handleMarkAsRead(notification.id);
                          setOpen(false);
                        }}
                        className="block hover:bg-muted"
                      >
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
