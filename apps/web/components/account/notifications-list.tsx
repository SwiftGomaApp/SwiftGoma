"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api/routes/notifications.routes";
import { getNotificationIcon } from "@/lib/notification-icons";
import { useNotifications } from "@/lib/notifications/notifications-context";
import { useOrderDetails } from "@/components/account/order-details-provider";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/language";
import {
  getNotificationLink,
  getNotificationOrderId,
} from "@/lib/notifications/notification-link";

const PREVIEW_SIZE = 5;

const STRINGS = {
  en: {
    markAllRead: "Mark all read",
    viewAll: "View all",
    empty: "No notifications yet",
    emptyDescription: "You'll see order updates and account activity here.",
  },
  fr: {
    markAllRead: "Tout marquer comme lu",
    viewAll: "Tout voir",
    empty: "Aucune notification pour le moment",
    emptyDescription:
      "Vous verrez ici les mises à jour de commandes et l'activité du compte.",
  },
} as const;

function formatDate(value: string, locale: Locale): string {
  return new Date(value).toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function NotificationsList({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const { refresh: refreshUnreadCount } = useNotifications();

  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const router = useRouter();
  const { openOrderDetails } = useOrderDetails();

  useEffect(() => {
    listNotifications({ page: 1, limit: PREVIEW_SIZE })
      .then((result) => {
        setItems(result.notifications);
        setHasMore(result.pagination.totalPages > 1);
      })
      .catch(() => setItems([]));
  }, []);

  async function handleOpenItem(item: AppNotification) {
    if (!item.isRead) {
      setItems(
        (prev) =>
          prev?.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)) ??
          null,
      );
      try {
        await markNotificationRead(item.id);
        refreshUnreadCount();
      } catch {
        // leave optimistic state; next load will resync
      }
    }

    const orderId = getNotificationOrderId(item);
    if (orderId) {
      openOrderDetails(orderId);
      return;
    }

    const link = getNotificationLink(item);
    if (link) router.push(link);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev?.filter((n) => n.id !== id) ?? null);
    try {
      await deleteNotification(id);
      refreshUnreadCount();
    } catch {
      // ignore — list will resync on next load
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev?.map((n) => ({ ...n, isRead: true })) ?? null);
      refreshUnreadCount();
    } finally {
      setMarkingAll(false);
    }
  }

  const hasUnread = items?.some((n) => !n.isRead) ?? false;

  if (items === null) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bell />
          </EmptyMedia>
          <EmptyTitle>{t.empty}</EmptyTitle>
          <EmptyDescription>{t.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            {t.markAllRead}
          </Button>
        </div>
      )}

      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = getNotificationIcon(item.type);
          return (
            <li key={item.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleOpenItem(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleOpenItem(item);
                }}
                className={cn(
                  "group flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted/60",
                  !item.isRead && "bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                    item.isRead
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    {!item.isRead && (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt, locale)}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <Button
          type="button"
          variant="outline"
          className="w-fit self-center"
          nativeButton={false}
          render={<Link href="/account/notifications/all" />}
        >
          {t.viewAll}
        </Button>
      )}
    </div>
  );
}

export default NotificationsList;
