import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "MbiyoPay" };

export default function MbiyoPayGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">MbiyoPay</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        MbiyoPay is the platform&apos;s buyer- and seller-facing mobile money provider,
        covering the DRC and Rwanda — separate from{" "}
        <Link href="/docs/payments" className="text-primary underline underline-offset-2">
          PawaPay
        </Link>
        , which is scoped narrowly to subscriptions and expenses internally. Every endpoint on
        this page requires an ADMIN or ACCOUNTANT role and lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/mbiyopay
        </code>
        .
      </p>
      <Callout variant="note" title="What actually runs through MbiyoPay">
        Buyer checkout (see{" "}
        <Link href="/reference/checkout" className="text-primary underline underline-offset-2">
          POST /orders/checkout
        </Link>{" "}
        in the{" "}
        <Link href="/docs/orders" className="text-primary underline underline-offset-2">
          Orders guide
        </Link>
        ), order refunds, and seller wallet withdrawals all settle through MbiyoPay under the
        hood. The endpoints on this page are the platform&apos;s own finance tooling around
        that — checking status and balances, and manually triggering a payout — not something
        a buyer or seller calls directly.
      </Callout>
      <Callout variant="tip" title="Same OTP-approval pattern as PawaPay">
        Payouts here go through the identical request-approval / confirm flow described in the{" "}
        <Link href="/docs/payments" className="text-primary underline underline-offset-2">
          Payments guide
        </Link>{" "}
        — one shared implementation backs both providers. If you&apos;ve already integrated
        PawaPay payouts, MbiyoPay payouts work the same way.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Supported countries</h2>
      <InfoTable
        columns={["Country", "Networks", "Currency", "Amount range"]}
        rows={[
          ["DRC (CD)", "vodacom, airtel, orange, africell", "USD", "0.1 – 2,500"],
          ["", "", "CDF", "40 – 5,000,000"],
          ["Rwanda (RW)", "mtn, airtel", "RWF", "100 – 5,000,000"],
        ]}
      />
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <Link href="/reference/get-mbiyopay-countries" className="text-primary underline underline-offset-2">
          GET /countries
        </Link>{" "}
        returns this same information live from the connected account — worth checking before
        hardcoding limits, since they can change.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Payin</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <Link href="/reference/initiate-payin" className="text-primary underline underline-offset-2">
          POST /payin
        </Link>{" "}
        requests a mobile money charge directly — like PawaPay deposits, this one call isn&apos;t
        OTP-gated, since it only ever brings money in. A duplicate submission with the same
        amount, currency, network, and phone number within a 5-minute window resolves to the
        same payin instead of charging twice, even without an explicit orderId.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Payout</h2>
      <InfoTable
        columns={["Step", "Endpoint"]}
        rows={[
          [
            "1. Request approval",
            <Link key="a" href="/reference/request-mbiyopay-payout-approval" className="text-primary underline underline-offset-2">
              POST /payout/request-approval
            </Link>,
          ],
          [
            "2. Confirm",
            <Link key="b" href="/reference/confirm-mbiyopay-payout" className="text-primary underline underline-offset-2">
              POST /payout/confirm
            </Link>,
          ],
          [
            "History",
            <Link key="c" href="/reference/get-mbiyopay-payout-history" className="text-primary underline underline-offset-2">
              GET /payout/history
            </Link>,
          ],
        ]}
      />
      <Callout variant="warning" title="Production payouts require MbiyoPay-side KYC">
        Confirming a payout can fail with <code>MBIYOPAY_KYC_REQUIRED</code> if the platform&apos;s
        own MbiyoPay account hasn&apos;t completed KYC on their side yet — this is separate from,
        and unrelated to, SwiftGoma&apos;s seller KYC.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Checking status &amp; balances</h2>
      <InfoTable
        columns={["What", "Endpoint"]}
        rows={[
          [
            "Transaction status (payin or payout)",
            <Link key="a" href="/reference/get-mbiyopay-transaction-status" className="text-primary underline underline-offset-2">
              GET /transactions/:transactionId
            </Link>,
          ],
          [
            "Wallet balances",
            <Link key="b" href="/reference/get-mbiyopay-balances" className="text-primary underline underline-offset-2">
              GET /balances
            </Link>,
          ],
          [
            "Balances by network",
            <Link key="c" href="/reference/get-mbiyopay-network-balances" className="text-primary underline underline-offset-2">
              GET /balances/networks
            </Link>,
          ],
        ]}
      />
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">GET /transactions/:transactionId</code> accepts
        either MbiyoPay&apos;s own transaction ID or the <code>orderId</code> you supplied when
        initiating the payin or payout. Network balances are useful for spotting when one
        specific carrier&apos;s float is running low before it causes payout failures.
      </p>

      <Link
        href="/reference/initiate-payin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the MbiyoPay endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
