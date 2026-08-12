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
  Newspaper,
  MessageSquare,
  Banknote,
  History,
  AlertTriangle,
  ShoppingBag,
  Boxes,
  FileText,
} from "lucide-react";

export type AdminRole = "ADMIN" | "SUPPORT" | "ACCOUNTANT";

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
    label: "Vue d'ensemble",
    items: [
      {
        title: "Tableau de bord",
        href: "/user/admin",
        icon: LayoutDashboard,
        roles: ["ADMIN"],
      },
      {
        title: "Tableau de bord",
        href: "/user/support",
        icon: LayoutDashboard,
        roles: ["SUPPORT"],
      },
      {
        title: "Tableau de bord",
        href: "/user/accountant",
        icon: LayoutDashboard,
        roles: ["ACCOUNTANT"],
      },
    ],
  },
  {
    label: "Paiements",
    items: [
      {
        title: "PawaPay",
        href: "/payments/pawapay",
        icon: CreditCard,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
      {
        title: "MbiyoPay",
        href: "/payments/mbiyopay",
        icon: Wallet,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
      {
        title: "Historique des transactions",
        href: "/payments/transactions",
        icon: History,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
      {
        title: "Configuration active",
        href: "/payments/active-configuration",
        icon: SlidersHorizontal,
        roles: ["ADMIN", "SUPPORT"],
      },
      {
        title: "Statistiques de facturation",
        href: "/billing/stats",
        icon: Receipt,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
      {
        title: "Documents",
        href: "/billing/invoices",
        icon: FileText,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
      {
        title: "Dépenses SwiftGoma",
        href: "/expenses",
        icon: Banknote,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
    ],
  },
  {
    label: "Place de marché",
    items: [
      {
        title: "Forfaits",
        href: "/plans",
        icon: Package,
        roles: ["ADMIN"],
      },
      {
        title: "Commandes",
        href: "/orders",
        icon: ShoppingBag,
        roles: ["ADMIN", "SUPPORT"],
      },
      {
        title: "Abonnements",
        href: "/subscriptions",
        icon: TrendingUp,
        roles: ["ADMIN", "ACCOUNTANT"],
      },
      {
        title: "Catégories",
        href: "/categories",
        icon: Tags,
        roles: ["ADMIN", "SUPPORT"],
      },
      {
        title: "Taux de change",
        href: "/exchange-rates",
        icon: ArrowLeftRight,
        roles: ["ADMIN", "SUPPORT"],
      },
      {
        title: "Blog",
        href: "/blog",
        icon: Newspaper,
        roles: ["ADMIN", "SUPPORT"],
      },
    ],
  },
  {
    label: "Vendeurs",
    items: [
      {
        title: "Vendeurs",
        href: "/sellers",
        icon: Building2,
        roles: ["ADMIN", "SUPPORT"],
      },
      {
        title: "Revue KYC",
        href: "/sellers/kyc",
        icon: ShieldCheck,
        roles: ["ADMIN", "SUPPORT"],
      },
      {
        title: "Boutiques",
        href: "/shops",
        icon: Store,
        roles: ["ADMIN", "SUPPORT"],
      },
      {
        title: "Produits",
        href: "/products",
        icon: Boxes,
        roles: ["ADMIN", "SUPPORT"],
      },
    ],
  },
  {
    label: "Utilisateurs",
    items: [
      {
        title: "Utilisateurs",
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
      {
        title: "Messages",
        href: "/messages",
        icon: MessageSquare,
        roles: ["ADMIN", "SUPPORT"],
      },
    ],
  },
  {
    label: "Système",
    items: [
      {
        title: "Incidents",
        href: "/incidents",
        icon: AlertTriangle,
        roles: ["ADMIN", "SUPPORT"],
      },
    ],
  },
];

export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  {
    title: "Profil et sécurité",
    href: "/account/security",
    icon: UserCog,
    roles: ["ADMIN", "SUPPORT", "ACCOUNTANT"],
  },
];
