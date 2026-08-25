import {
  Bell,
  CreditCard,
  LifeBuoy,
  Megaphone,
  MessageCircle,
  Package,
  ShieldAlert,
  Store,
} from "lucide-react";

import type { NotificationType } from "@/lib/api/routes/notifications.routes";

type IconComponent = typeof Bell;

const ICONS: Record<NotificationType, IconComponent> = {
  ORDER_STATUS: Package,
  ORDER_MESSAGE: MessageCircle,
  PAYMENT: CreditCard,
  ACCOUNT_SECURITY: ShieldAlert,
  PROMO: Megaphone,
  SELLER_ONBOARDING: Store,
  SUPPORT: LifeBuoy,
  SYSTEM: Bell,
};

export function getNotificationIcon(type: NotificationType): IconComponent {
  return ICONS[type] ?? Bell;
}
