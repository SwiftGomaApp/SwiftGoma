"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type Notification,
  type NotificationType,
} from "@/lib/api/routes/notifications";
import { useNotifications } from "@/providers/notifications-provider";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { formatDateTime } from "@/lib/i18n/format";
import { labelOf, notificationTypeLabels } from "@/lib/i18n/labels";
import { ui } from "@/lib/i18n/common";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

const TYPES: NotificationType[] = [
  "ORDER_STATUS",
  "PAYMENT",
  "ACCOUNT_SECURITY",
  "PROMO",
  "SELLER_ONBOARDING",
  "SUPPORT",
  "SYSTEM",
];

export function NotificationsInbox() {
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listNotifications({
        page,
        limit: 20,
        unreadOnly: filter === "unread",
        type: typeFilter || undefined,
      });
      setNotifications(result.notifications);
      setTotalPages(result.pagination.totalPages);
      await refreshUnreadCount();
    } catch (err) {
      setError(
        getErrorMessage(err, "Impossible de charger les notifications."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, typeFilter]);

  useEffect(() => {
    function handleNewNotification(event: Event) {
      const notification = (event as CustomEvent<Notification>).detail;
      if (!notification) return;
      if (filter === "unread" && notification.isRead) return;
      if (typeFilter && notification.type !== typeFilter) return;
      if (page !== 1) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, 20);
      });
    }

    window.addEventListener("notification:new", handleNewNotification);
    return () =>
      window.removeEventListener("notification:new", handleNewNotification);
  }, [filter, typeFilter, page]);

  async function handleMarkRead(id: string) {
    setBusyId(id);
    try {
      await markNotificationRead(id);
      if (filter === "unread") {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
      }
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
      if (filter === "unread") {
        setNotifications([]);
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {isLoading
            ? ui.loading
            : `${unreadCount} non ${unreadCount === 1 ? "lu" : "lus"}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect
            value={filter}
            onChange={(e) => {
              setPage(1);
              setFilter(e.target.value as "all" | "unread");
            }}
            className="w-32"
          >
            <NativeSelectOption value="all">{ui.all}</NativeSelectOption>
            <NativeSelectOption value="unread">
              {ui.unreadOnly}
            </NativeSelectOption>
          </NativeSelect>
          <NativeSelect
            value={typeFilter}
            onChange={(e) => {
              setPage(1);
              setTypeFilter(e.target.value as NotificationType | "");
            }}
            className="w-44"
          >
            <NativeSelectOption value="">{ui.allTypes}</NativeSelectOption>
            {TYPES.map((t) => (
              <NativeSelectOption key={t} value={t}>
                {labelOf(notificationTypeLabels, t)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0}
            onClick={handleMarkAllRead}
          >
            {ui.markAllRead}
          </Button>
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Bell className="text-muted-foreground h-8 w-8" />
          <p className="text-sm font-medium">Aucune notification</p>
          <p className="text-muted-foreground text-xs">
            Les alertes dans l'application et les notifications push apparaissent
            ici en temps réel.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y rounded-lg border">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start justify-between gap-3 px-4 py-3",
                  !n.isRead && "bg-primary/5",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!n.isRead && (
                      <span className="bg-primary h-2 w-2 shrink-0 rounded-full" />
                    )}
                    <span className="text-sm font-medium">{n.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {labelOf(notificationTypeLabels, n.type)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">{n.body}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDateTime(n.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={busyId === n.id}
                      onClick={() => handleMarkRead(n.id)}
                      aria-label={ui.markRead}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={busyId === n.id}
                    onClick={() => handleDelete(n.id)}
                    aria-label={ui.delete}
                  >
                    {busyId === n.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              {ui.pageOf(page, totalPages)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {ui.previous}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {ui.next}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
