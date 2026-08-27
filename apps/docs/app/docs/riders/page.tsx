import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Riders" };

export default function RidersGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Riders</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        Riders handle delivery for a shop&apos;s orders — see{" "}
        <Link href="/docs/orders" className="text-primary underline underline-offset-2">
          Rider Delivery
        </Link>{" "}
        for the delivery lifecycle itself. Every endpoint on this page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/riders
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Inviting a rider</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        A seller invites a rider by email — this creates a RIDER-role account (if one doesn&apos;t
        already exist for that address) linked to the seller&apos;s shop, and emails a
        verification code the invitee uses to set their password and activate the account.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Lifecycle</h2>
      <InfoTable
        columns={["Action", "Effect"]}
        rows={[
          ["Suspend", "Rider can no longer be assigned deliveries. Existing in-progress deliveries are unaffected."],
          ["Reactivate", "Restores assignment eligibility."],
          ["Delete", "Removes the rider from the shop. Requires no active deliveries in progress."],
        ]}
      />

      <Callout variant="note">
        Only the seller who owns the shop the rider belongs to can manage them — riders aren&apos;t
        shared across shops.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">A rider&apos;s own view</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        A signed-in rider can pull their own delivery history — every order they&apos;ve been
        assigned, past and present.
      </p>

      <Link
        href="/reference/list-sellers-riders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Riders endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
