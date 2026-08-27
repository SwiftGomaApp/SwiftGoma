import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        Role-specific overview and metrics endpoints — each one aggregates data that already
        exists elsewhere in the API into a single call, so a staff dashboard doesn&apos;t need to
        make a dozen requests to render its home screen. Every endpoint on this page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/dashboard
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">By role</h2>
      <InfoTable
        columns={["Endpoint", "Role", "Covers"]}
        rows={[
          ["GET /support/overview", "SUPPORT", "Open contact messages, recent incidents."],
          ["GET /support/metrics", "SUPPORT", "Response-time and volume metrics."],
          [
            "GET /accountant/overview",
            "ACCOUNTANT",
            <>
              Pending expenses, recent reports — see{" "}
              <Link href="/docs/expenses" className="text-primary underline underline-offset-2">
                Expenses
              </Link>{" "}
              and{" "}
              <Link href="/docs/accounting" className="text-primary underline underline-offset-2">
                Accounting
              </Link>
              .
            </>,
          ],
          ["GET /admin/overview", "ADMIN", "Platform-wide snapshot across users, orders, and revenue."],
          ["GET /admin/metrics", "ADMIN", "Deeper platform metrics for trend analysis."],
        ]}
      />

      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        These are read-only aggregation endpoints — for the underlying detail behind any figure,
        use the feature-specific endpoint it&apos;s drawn from.
      </p>

      <Link
        href="/reference/get-support-overview"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Dashboard endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
