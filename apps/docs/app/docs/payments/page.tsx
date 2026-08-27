import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { StepList } from "@/components/step-list";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Payments" };

export default function PaymentsGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Payments</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        SwiftGoma settles mobile money through{" "}
        <a
          href="https://docs.pawapay.io"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-2"
        >
          PawaPay
        </a>
        . On SwiftGoma, PawaPay is scoped narrowly to two internal flows — collecting seller
        subscription payments, and paying out approved expenses to vendors. Every endpoint on
        this page requires an ADMIN or ACCOUNTANT role and lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/pawapay
        </code>
        .
      </p>
      <Callout variant="warning" title="Not the buyer-facing payment provider">
        Buyer checkout, order refunds, and seller wallet payouts all run through{" "}
        <Link href="/docs/mbiyopay" className="text-primary underline underline-offset-2">
          MbiyoPay
        </Link>{" "}
        instead — see that guide for those flows.{" "}
        <Link href="/reference/initiate-deposit" className="text-primary underline underline-offset-2">
          POST /deposits
        </Link>{" "}
        here is used by subscription billing specifically, and payouts here are used by the
        expense-approval flow specifically — this section isn&apos;t a general-purpose payment
        gateway for the rest of the platform.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">The OTP-approval pattern</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Every payout and refund goes through the same two-step, human-verified flow before any
        money actually moves — no single API call sends funds.
      </p>
      <StepList
        steps={[
          {
            title: "Request approval",
            body: "Validates the request and emails a one-time verification code to the requesting admin. Nothing is sent to PawaPay yet, and the amount and count are checked against that admin's daily limits.",
          },
          {
            title: "Confirm",
            body: "Submitting the correct code within 5 minutes actually sends the payout or refund to PawaPay. Repeated wrong codes lock the flow out temporarily.",
          },
        ]}
      />
      <InfoTable
        columns={["", "Request approval", "Confirm"]}
        rows={[
          [
            "Payouts",
            <Link key="a" href="/reference/request-payout-approval" className="text-primary underline underline-offset-2">
              POST /payouts/request-approval
            </Link>,
            <Link key="b" href="/reference/confirm-payout" className="text-primary underline underline-offset-2">
              POST /payouts/confirm
            </Link>,
          ],
          [
            "Refunds",
            <Link key="c" href="/reference/request-refund-approval" className="text-primary underline underline-offset-2">
              POST /refunds/request-approval
            </Link>,
            <Link key="d" href="/reference/confirm-refund" className="text-primary underline underline-offset-2">
              POST /refunds/confirm
            </Link>,
          ],
        ]}
      />
      <Callout variant="warning" title="Direct-send endpoints are deliberately disabled">
        <code>POST /refunds</code> exists but always returns a validation error telling you to
        use the request-approval / confirm pair instead — there&apos;s intentionally no way to
        move money in a single call.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Deposits</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <Link href="/reference/initiate-deposit" className="text-primary underline underline-offset-2">
          POST /deposits
        </Link>{" "}
        requests a mobile money charge directly, without the OTP flow — it&apos;s the one
        money-moving call that isn&apos;t OTP-gated, since it only ever takes money{" "}
        <em>in</em>. Duplicate submissions with identical amount, currency, provider, and phone
        number within a 5-minute window resolve to the same deposit instead of charging twice,
        even without an explicit idempotency key.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Checking status</h2>
      <InfoTable
        columns={["Resource", "Status", "History"]}
        rows={[
          [
            "Deposits",
            <Link key="a" href="/reference/get-deposit-status" className="text-primary underline underline-offset-2">
              GET /deposits/:depositId
            </Link>,
            "—",
          ],
          [
            "Payouts",
            <Link key="b" href="/reference/get-payout-status" className="text-primary underline underline-offset-2">
              GET /payouts/:payoutId
            </Link>,
            <Link key="c" href="/reference/get-payout-history" className="text-primary underline underline-offset-2">
              GET /payouts/history
            </Link>,
          ],
          [
            "Refunds",
            <Link key="d" href="/reference/get-refund-status" className="text-primary underline underline-offset-2">
              GET /refunds/:refundId
            </Link>,
            "—",
          ],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Phone numbers</h2>
      <Callout variant="tip">
        PawaPay expects MSISDN format — digits only, country code included, no leading{" "}
        <code>+</code>. For example <code>243812345678</code>, not <code>+243812345678</code>.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Wallet &amp; configuration</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <Link href="/reference/get-wallet-balances" className="text-primary underline underline-offset-2">
          GET /wallet-balances
        </Link>{" "}
        returns the platform&apos;s current PawaPay balances by currency.{" "}
        <Link href="/reference/get-active-configuration" className="text-primary underline underline-offset-2">
          GET /active-configuration
        </Link>{" "}
        returns which countries, providers, and currencies are currently enabled, and how each
        one formats amounts — useful before constructing a deposit or payout payload for a
        provider you haven&apos;t used yet.
      </p>

      <Link
        href="/reference/initiate-deposit"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Payments endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
