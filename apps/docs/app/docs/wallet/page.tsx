import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { StepList } from "@/components/step-list";

export const metadata: Metadata = { title: "Wallet" };

export default function WalletGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Wallet</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        A seller&apos;s earnings balance, accumulated from order payments, and the OTP-gated flow
        to pay it out. Wallet payouts go through{" "}
        <Link href="/docs/mbiyopay" className="text-primary underline underline-offset-2">
          MbiyoPay
        </Link>
        , not PawaPay. Every endpoint on this page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Payout settings</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Before a seller can request a payout, they configure where it goes —{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">wallet-settings</code>{" "}
        stores the destination mobile money number, provider, and country. Create it once, then
        update it any time.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Balance and history</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">GET /wallet</code>{" "}
        returns the current balance;{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">GET /wallet/transactions</code>{" "}
        returns the paginated ledger of credits (order payments) and debits (payouts) behind it.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Requesting a payout</h2>
      <StepList
        steps={[
          {
            title: "Request a code",
            body: (
              <>
                <Link href="/reference/request-wallet-payout-otp" className="text-primary underline underline-offset-2">
                  POST /wallet/payout/request
                </Link>{" "}
                validates the requested amount against the available balance and emails a
                verification code.
              </>
            ),
          },
          {
            title: "Confirm",
            body: (
              <>
                <Link href="/reference/initiate-wallet-payout" className="text-primary underline underline-offset-2">
                  POST /wallet/payout
                </Link>{" "}
                with the code sends the payout via MbiyoPay to the configured wallet settings.
              </>
            ),
          },
        ]}
      />

      <Callout variant="note">
        The OTP-gated request/confirm shape is the same pattern used for admin payouts across the
        platform — it exists so a compromised session alone can&apos;t drain a wallet without also
        controlling the seller&apos;s email.
      </Callout>

      <Link
        href="/reference/create-wallet-settings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Wallet endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
