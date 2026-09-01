import type { AppNotification } from "@/lib/api/routes/notifications.routes";

export function getNotificationLink(
  notification: Pick<AppNotification, "data">,
): string | null {
  const data = notification.data;
  if (!data) return null;

  if (typeof data.url === "string" && data.url.startsWith("/")) {
    return data.url;
  }

  if (typeof data.href === "string" && data.href.startsWith("/")) {
    return data.href;
  }

  if (typeof data.orderId === "string") {
    const base = `/account/orders/${data.orderId}`;
    if (typeof data.messageId === "string") {
      return `${base}?messageId=${encodeURIComponent(data.messageId)}`;
    }
    return base;
  }

  return null;
}
