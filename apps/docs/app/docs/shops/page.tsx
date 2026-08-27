import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Shops" };

export default function ShopsGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Shops</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        A shop is the public storefront a seller&apos;s products are listed under — separate
        from the{" "}
        <Link href="/docs/seller-profile" className="text-primary underline underline-offset-2">
          seller profile
        </Link>{" "}
        that represents the business itself. Every endpoint on this page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/seller
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Public browsing</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Anyone can list and view published shops — no authentication required. Only shops with
        status <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">PUBLISHED</code>{" "}
        appear.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Seller-managed lifecycle</h2>
      <InfoTable
        columns={["Status", "Meaning"]}
        rows={[
          ["DRAFT", "Created but not yet published — invisible to buyers."],
          ["PUBLISHED", "Live and visible to buyers."],
          ["UNPUBLISHED", "Taken offline by the seller; can be republished."],
          ["SUSPENDED", "Taken offline by staff. Only staff can reactivate."],
          ["DELETED", "Soft-deleted by the seller."],
        ]}
      />
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        A seller creates, updates, publishes, and unpublishes their own shop. Publishing requires
        the seller profile to already be <code>ACTIVE</code> — a shop can&apos;t go live before{" "}
        <Link href="/docs/kyc" className="text-primary underline underline-offset-2">
          KYC
        </Link>{" "}
        is approved.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Staff moderation</h2>
      <Callout variant="warning" title="Suspension cascades">
        Suspending a shop also blocks new orders and cart activity against every product in it —
        see{" "}
        <Link href="/docs/orders" className="text-primary underline underline-offset-2">
          Orders
        </Link>
        . A suspended shop can only be reactivated by staff, never by the seller themselves.
      </Callout>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Admins can list all shops platform-wide (with status and search filters), suspend or
        reactivate one, hard-delete one, or restore a soft-deleted one.
      </p>

      <Link
        href="/reference/list-shops"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Shops endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
