"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Notifications",
    markAllRead: "Mark all read",
    viewAll: "View all",
    empty: "No notifications yet",
    emptyDescription: "You'll see order updates and account activity here.",
  },
  fr: {
    title: "Notifications",
    markAllRead: "Tout marquer comme lu",
    viewAll: "Tout voir",
    empty: "Aucune notification pour le moment",
    emptyDescription:
      "Vous verrez ici les mises à jour de commandes et l'activité du compte.",
  },
} as const;

function formatRelativeTime(value: string, locale: Locale): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  const rtf = new Intl.RelativeTimeFormat(locale === "fr" ? "fr" : "en", {
    numeric: "auto",
  });

  if (diffMinutes < 1) return rtf.format(0, "minute");
  if (diffMinutes < 60) return rtf.format(-diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return rtf.format(-diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return rtf.format(-diffDays, "day");
  return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "medium",
  });
}

export function NotificationModal({
  open,
  onOpenChange,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
}) {
  const t = STRINGS[locale];
  const { refresh: refreshUnreadCount } = useNotifications();

  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!open) return;
    listNotifications({ limit: 10 })
      .then((result) => setItems(result.notifications))
      .catch(() => setItems([]));
  }, [open]);

  async function handleOpenItem(item: AppNotification) {
    if (item.isRead) return;
    setItems(
      (prev) =>
        prev?.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)) ??
        null,
    );
    try {
      await markNotificationRead(item.id);
      refreshUnreadCount();
    } catch {
      // leave optimistic state; next open will resync
    }
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev?.filter((n) => n.id !== id) ?? null);
    try {
      await deleteNotification(id);
      refreshUnreadCount();
    } catch {
      // ignore — list will resync on next open
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] min-w-0 overflow-y-auto sm:max-w-md">
        <DialogHeader className="min-w-0 pr-8">
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>

        {items === null ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Bell />
              </EmptyMedia>
              <EmptyTitle>{t.empty}</EmptyTitle>
              <EmptyDescription>{t.emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex min-w-0 flex-col gap-3">
            {hasUnread && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="self-end"
              >
                {markingAll ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="size-3.5" />
                )}
                {t.markAllRead}
              </Button>
            )}
            <ul className="flex min-w-0 flex-col gap-1">
            {items.map((item) => {
              const Icon = getNotificationIcon(item.type);
              return (
                <li key={item.id} className="min-w-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenItem(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleOpenItem(item);
                    }}
                    className={cn(
                      "group flex min-w-0 items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/60",
                      !item.isRead && "bg-primary/5",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        item.isRead
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 truncate text-sm font-medium text-foreground">
                          {item.title}
                        </span>
                        {!item.isRead && (
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="line-clamp-2 min-w-0 text-sm text-muted-foreground break-words">
                        {item.body}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(item.createdAt, locale)}
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
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
            </ul>
          </div>
        )}

        {items !== null && items.length > 0 && (
          <DialogFooter>
            <Button
              variant="ghost"
              className="w-full"
              nativeButton={false}
              render={<Link href="/account/notifications" />}
              onClick={() => onOpenChange(false)}
            >
              {t.viewAll}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NotificationModal;
