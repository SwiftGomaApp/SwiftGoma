import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Accounting" };

export default function AccountingGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Accounting</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        Financial reporting and a unified view of money movement across both{" "}
        <Link href="/docs/payments" className="text-primary underline underline-offset-2">
          PawaPay
        </Link>{" "}
        and{" "}
        <Link href="/docs/mbiyopay" className="text-primary underline underline-offset-2">
          MbiyoPay
        </Link>
        . Restricted to ADMIN and ACCOUNTANT roles throughout.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Reports</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">
          GET /accounting/report
        </code>{" "}
        builds a period summary — subscription revenue, order payments and GMV, invoice count,
        and payout counts — without generating a file. The same data is available as a
        downloadable PDF, a CSV, or emailed directly to admin recipients.
      </p>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Every PDF generated is stored, so{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">
          GET /accounting/reports
        </code>{" "}
        can list past reports and{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">
          GET /accounting/reports/:id/pdf
        </code>{" "}
        re-downloads one without regenerating it.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Transactions</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">
          GET /payments/transactions
        </code>{" "}
        lists admin-initiated payouts from both providers in one place — filter by{" "}
        <code>provider</code> to isolate one.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Payment ledger</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        The broadest view available:{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">
          GET /payments/ledger
        </code>{" "}
        records every money movement platform-wide — order payments, subscription payments,
        payouts, refunds — with a <code>direction</code> (IN or OUT) and a <code>source</code>{" "}
        tag, regardless of which feature or provider created it.
      </p>

      <InfoTable
        columns={["Source examples", "Meaning"]}
        rows={[
          ["ORDER_PAYMENT", "A buyer's checkout payment."],
          ["SUBSCRIPTION_PAYMENT", "A seller's plan subscription payment."],
          ["ADMIN_PAYOUT", "An admin-approved expense or manual payout."],
          ["SELLER_PAYOUT", "A seller wallet payout."],
        ]}
      />

      <Callout variant="tip">
        <Link href="/reference/export-payment-ledger-csv" className="text-primary underline underline-offset-2">
          GET /payments/ledger/export/csv
        </Link>{" "}
        respects the same filters as the JSON endpoint — useful for reconciling against an
        external accounting tool.
      </Callout>

      <Link
        href="/reference/get-accountant-report-preview"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Accounting endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
