"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ProductPagination } from "@/components/products/product-pagination";
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationListResult,
} from "@/lib/api/routes/notifications.routes";
import { getNotificationIcon } from "@/lib/notification-icons";
import {
  getNotificationLink,
  getNotificationOrderId,
} from "@/lib/notifications/notification-link";
import { useNotifications } from "@/lib/notifications/notifications-context";
import { useOrderDetails } from "@/components/account/order-details-provider";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/language";

const PAGE_SIZE = 20;

const STRINGS = {
  en: {
    breadcrumb: "Notifications",
    title: "All notifications",
    description: "Every update on your account, in one place.",
    markAllRead: "Mark all read",
    empty: "No notifications yet",
    emptyDescription: "You'll see order updates and account activity here.",
    resultsOne: "notification",
    resultsMany: "notifications",
  },
  fr: {
    breadcrumb: "Notifications",
    title: "Toutes les notifications",
    description: "Toute l'activité de votre compte, au même endroit.",
    markAllRead: "Tout marquer comme lu",
    empty: "Aucune notification pour le moment",
    emptyDescription:
      "Vous verrez ici les mises à jour de commandes et l'activité du compte.",
    resultsOne: "notification",
    resultsMany: "notifications",
  },
} as const;

function formatDate(value: string, locale: Locale): string {
  return new Date(value).toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function NotificationsAllView({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const { refresh: refreshUnreadCount } = useNotifications();

  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [pagination, setPagination] = useState<
    NotificationListResult["pagination"] | null
  >(null);
  const [markingAll, setMarkingAll] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const { openOrderDetails } = useOrderDetails();

  useEffect(() => {
    setItems(null);
    listNotifications({ page: currentPage, limit: PAGE_SIZE })
      .then((result) => {
        setItems(result.notifications);
        setPagination(result.pagination);
      })
      .catch(() => {
        setItems([]);
        setPagination(null);
      });
  }, [currentPage]);

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

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/account/notifications" />}>
              {t.breadcrumb}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
          {pagination && pagination.total > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {pagination.total}{" "}
              {pagination.total === 1 ? t.resultsOne : t.resultsMany}
            </p>
          )}
        </div>

        {hasUnread && (
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
        )}
      </div>

      {items === null ? (
        <div className="flex justify-center py-10">
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
        <>
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
                      <p className="text-sm text-muted-foreground">
                        {item.body}
                      </p>
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

          {pagination && (
            <div className="mt-2">
              <ProductPagination
                pagination={pagination}
                searchParams={Object.fromEntries(searchParams.entries())}
                basePath="/account/notifications/all"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NotificationsAllView;
