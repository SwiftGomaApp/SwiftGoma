import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Welcome" };

const CARDS = [
  {
    title: "Authentication",
    description:
      "How sessions work, signing in with a password, an email code, a passkey, or Google, and adding two-factor authentication.",
    href: "/docs/authentication",
  },
  {
    title: "Users",
    description:
      "Managing a signed-in user's profile, contact details, linked sign-in methods, and account lifecycle.",
    href: "/docs/users",
  },
  {
    title: "Products",
    description:
      "Browsing and searching the catalog, listing products as a seller, managing stock, reviews, and multi-currency pricing.",
    href: "/docs/products",
  },
  {
    title: "Orders",
    description:
      "Cart, checkout, the full order lifecycle across buyer, seller, and rider, QR-code handoffs, in-delivery chat, and refunds.",
    href: "/docs/orders",
  },
  {
    title: "Seller Profile",
    description:
      "Creating and managing a seller's business profile — the first step of onboarding, ahead of KYC.",
    href: "/docs/seller-profile",
  },
  {
    title: "Seller KYC",
    description:
      "Identity verification for sellers — submitting documents, and the two-stage staff review that activates a profile.",
    href: "/docs/kyc",
  },
  {
    title: "Payments",
    description:
      "The PawaPay integration — used narrowly for subscription billing and expense payouts, with OTP-gated payouts and refunds.",
    href: "/docs/payments",
  },
  {
    title: "MbiyoPay",
    description:
      "The buyer- and seller-facing mobile money provider — checkout, order refunds, and seller wallet payouts, covering DRC and Rwanda.",
    href: "/docs/mbiyopay",
  },
  {
    title: "Shops",
    description:
      "The public storefront a seller's products live under — creation, publishing, and staff moderation (suspend, reactivate, restore).",
    href: "/docs/shops",
  },
  {
    title: "Riders",
    description:
      "Inviting and managing delivery riders under a shop, and a rider's own delivery history.",
    href: "/docs/riders",
  },
  {
    title: "Billing",
    description:
      "Subscription plans, subscribing/upgrading/cancelling, and the invoices generated along the way — billed through PawaPay.",
    href: "/docs/billing",
  },
  {
    title: "Wallet",
    description:
      "A seller's earnings balance, payout settings, transaction history, and OTP-gated payout requests via MbiyoPay.",
    href: "/docs/wallet",
  },
  {
    title: "Expenses",
    description:
      "Recording company expenses and the OTP-gated admin approval flow that pays them out through PawaPay.",
    href: "/docs/expenses",
  },
  {
    title: "Accounting",
    description:
      "Financial reports (PDF/CSV/email), and a unified ledger of every payment and payout across both providers.",
    href: "/docs/accounting",
  },
  {
    title: "Notifications",
    description:
      "In-app notifications, read/unread state, and per-type delivery preferences — with some types that can't be muted.",
    href: "/docs/notifications",
  },
  {
    title: "Favorites",
    description: "Saving and browsing a buyer's favorited products.",
    href: "/docs/favorites",
  },
  {
    title: "Support",
    description: "The public contact form, and staff triage — assigning, updating, and closing messages.",
    href: "/docs/support",
  },
  {
    title: "Incidents",
    description: "A public status-page feed of platform incidents, and staff tools to open, update, and resolve them.",
    href: "/docs/incidents",
  },
  {
    title: "Blog",
    description: "Public blog posts, and staff CRUD for drafting, publishing, and managing them.",
    href: "/docs/blog",
  },
  {
    title: "Storefront",
    description: "The home page hero carousel — public read, staff-managed slides.",
    href: "/docs/storefront",
  },
  {
    title: "Dashboard",
    description: "Role-specific overview and metrics endpoints for support, accounting, and admin staff.",
    href: "/docs/dashboard",
  },
  {
    title: "API Reference",
    description: "Every endpoint, with parameters, example requests, and example responses.",
    href: "/reference",
  },
];

export default function WelcomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Introduction</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Welcome</h1>
      <p className="mb-10 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        The SwiftGoma API powers buying, selling, and delivery in Goma — accounts and sessions,
        seller onboarding, products, orders, and payments. This is the developer documentation
        for integrating with it.
      </p>

      <h2 className="mb-4 text-lg font-semibold tracking-tight">Learn more…</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-border p-5 transition hover:border-primary/40 hover:bg-muted"
          >
            <div className="mb-1.5 flex items-center gap-1.5">
              <h3 className="text-sm font-semibold">{card.title}</h3>
              <ArrowRight
                size={13}
                className="text-primary opacity-0 transition group-hover:opacity-100"
              />
            </div>
            <p className="text-sm text-muted-foreground">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
