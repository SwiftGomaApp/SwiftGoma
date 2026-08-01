import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  CreditCard,
  SlidersHorizontal,
  Package,
  TrendingUp,
  Tags,
  ArrowLeftRight,
  Building2,
  Store,
  ShieldCheck,
  Users,
  Bell,
  UserCog,
} from "lucide-react";

export type AdminRole = "ADMIN" | "SUPPORT";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: AdminRole[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/user/admin",
        icon: LayoutDashboard,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "Payments",
    items: [
      {
        title: "PawaPay",
        href: "/payments/pawapay",
        icon: CreditCard,
        roles: ["ADMIN"],
      },
      {
        title: "MbiyoPay",
        href: "/payments/mbiyopay",
        icon: Wallet,
        roles: ["ADMIN"],
      },
      {
        title: "Active Configuration",
        href: "/payments/active-configuration",
        icon: SlidersHorizontal,
        roles: ["ADMIN", "SUPPORT"],
      },
      {
        title: "Billing Stats",
        href: "/billing/stats",
        icon: Receipt,
        roles: ["ADMIN"],
      },
    ],
  },
  {
    label: "Marketplace",
    items: [
      {
        title: "Plans",
        href: "/plans",
        icon: Package,
        roles: ["ADMIN"],
      },
      {
        title: "Subscriptions",
        href: "/subscriptions",
        icon: TrendingUp,
        roles: ["ADMIN"],
      },
      {
        title: "Categories",
        href: "/categories",
        icon: Tags,
        roles: ["ADMIN", "SUPPORT"],
      },
      {
        title: "Exchange Rates",
        href: "/exchange-rates",
        icon: ArrowLeftRight,
        roles: ["ADMIN", "SUPPORT"],
      },
    ],
  },
  {
    label: "Sellers",
    items: [
      {
        title: "Sellers",
        href: "/sellers",
        icon: Building2,
        roles: ["ADMIN", "SUPPORT"],
      },
      {
        title: "KYC Review",
        href: "/sellers/kyc",
        icon: ShieldCheck,
        roles: ["ADMIN", "SUPPORT"],
      },
      {
        title: "Shops",
        href: "/shops",
        icon: Store,
        roles: ["ADMIN", "SUPPORT"],
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: Users,
        roles: ["ADMIN", "SUPPORT"],
      },
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
        roles: ["ADMIN", "SUPPORT"],
      },
    ],
  },
];

export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  {
    title: "Profile & Security",
    href: "/account/security",
    icon: UserCog,
    roles: ["ADMIN", "SUPPORT"],
  },
];
