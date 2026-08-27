import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { StepList } from "@/components/step-list";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Billing" };

export default function BillingGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Billing</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        Subscription plans, subscribing, and the invoices generated along the way. Subscription
        payments are billed through{" "}
        <Link href="/docs/payments" className="text-primary underline underline-offset-2">
          PawaPay
        </Link>
        , SwiftGoma&apos;s one use of that provider outside of expense payouts. This guide covers
        three endpoint groups, all under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Plans</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Plans are public and readable by anyone — by ID or by slug. Only admins can create plans,
        update their content, change price (a new price takes effect for new and renewing
        subscriptions, not retroactively), or activate/deactivate one.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Subscribing</h2>
      <StepList
        steps={[
          {
            title: "Subscribe",
            body: (
              <>
                <Link href="/reference/subscribe" className="text-primary underline underline-offset-2">
                  POST /subscriptions
                </Link>{" "}
                creates a subscription and a PawaPay deposit request. The response includes the
                deposit reference to poll or await via webhook.
              </>
            ),
          },
          {
            title: "Payment confirms",
            body: (
              <>
                Once PawaPay confirms the deposit, the subscription becomes <code>ACTIVE</code> and
                an invoice is generated automatically.
              </>
            ),
          },
          {
            title: "Renew, upgrade, or cancel",
            body: (
              <>
                <Link href="/reference/upgrade-subscription" className="text-primary underline underline-offset-2">
                  POST /:id/upgrade
                </Link>{" "}
                moves to a different plan;{" "}
                <Link href="/reference/cancel-subscription" className="text-primary underline underline-offset-2">
                  POST /:id/cancel
                </Link>{" "}
                stops auto-renewal at period end;{" "}
                <Link href="/reference/reactivate-subscription" className="text-primary underline underline-offset-2">
                  POST /:id/reactivate
                </Link>{" "}
                undoes a pending cancellation before it takes effect.
              </>
            ),
          },
        ]}
      />

      <Callout variant="tip">
        Not sure a payment went through?{" "}
        <Link href="/reference/check-subscription-payment-status" className="text-primary underline underline-offset-2">
          GET /:id/payment-status
        </Link>{" "}
        checks PawaPay directly rather than waiting on the webhook.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Invoices</h2>
      <InfoTable
        columns={["Endpoint", "Who"]}
        rows={[
          ["GET /invoices", "The signed-in seller's own invoices"],
          ["GET /invoices/:id/download", "PDF download of one invoice"],
          ["GET /invoices/admin", "Every invoice platform-wide — admin only"],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Admin visibility</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Admins can list every subscription platform-wide, inspect one in detail, and pull
        aggregate stats and revenue figures — useful for the{" "}
        <Link href="/docs/dashboard" className="text-primary underline underline-offset-2">
          admin dashboard
        </Link>
        .
      </p>

      <Link
        href="/reference/list-plans"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Billing endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
