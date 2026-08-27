import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { StepList } from "@/components/step-list";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Expenses" };

export default function ExpensesGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Expenses</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        Company expenses — recorded by accounting staff, paid out by admins via{" "}
        <Link href="/docs/payments" className="text-primary underline underline-offset-2">
          PawaPay
        </Link>{" "}
        once approved. Every endpoint on this page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/expenses
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Categories</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">GET /meta</code>{" "}
        returns the valid categories: <code>OPERATIONS</code>, <code>MARKETING</code>,{" "}
        <code>PAYROLL</code>, <code>LEGAL</code>, <code>TRAVEL</code>, <code>UTILITIES</code>,{" "}
        <code>EQUIPMENT</code>, <code>OTHER</code>.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Recording an expense</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        An ACCOUNTANT creates the expense with the vendor&apos;s payout details attached — name,
        phone number, country, and mobile money provider — so it&apos;s ready to pay out the
        moment it&apos;s approved. It can still be edited or rejected while{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">PENDING</code>.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Admin approval and payout</h2>
      <StepList
        steps={[
          {
            title: "Request",
            body: (
              <>
                <Link href="/reference/request-expense-approval" className="text-primary underline underline-offset-2">
                  POST /:id/approve/request
                </Link>{" "}
                validates the expense and emails the admin a verification code.
              </>
            ),
          },
          {
            title: "Resend (optional)",
            body: (
              <>
                <Link href="/reference/resend-expense-approval" className="text-primary underline underline-offset-2">
                  POST /:id/approve/resend
                </Link>{" "}
                if the code expired or didn&apos;t arrive.
              </>
            ),
          },
          {
            title: "Confirm",
            body: (
              <>
                <Link href="/reference/confirm-expense-approval" className="text-primary underline underline-offset-2">
                  POST /:id/approve/confirm
                </Link>{" "}
                with the code sends the PawaPay payout and moves the expense to{" "}
                <code>PROCESSING</code>.
              </>
            ),
          },
        ]}
      />

      <Callout variant="warning">
        Rejection is separate from the approval flow —{" "}
        <Link href="/reference/reject-expense" className="text-primary underline underline-offset-2">
          POST /:id/reject
        </Link>{" "}
        requires a reason and doesn&apos;t need a code, since it moves money nowhere.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Status values</h2>
      <InfoTable
        columns={["Status", "Meaning"]}
        rows={[
          ["PENDING", "Awaiting admin action."],
          ["REJECTED", "Declined — terminal."],
          ["PROCESSING", "Payout sent to PawaPay, awaiting confirmation."],
          ["COMPLETED", "Payout confirmed — terminal."],
          ["FAILED", "Payout failed at the provider."],
        ]}
      />

      <Link
        href="/reference/list-expenses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Expenses endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
