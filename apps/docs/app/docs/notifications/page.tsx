import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Notifications</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        In-app notifications delivered to a signed-in user, with per-type preferences to control
        which ones they receive. Every endpoint on this page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/notifications
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Types</h2>
      <InfoTable
        columns={["Type", "Example"]}
        rows={[
          ["ORDER_STATUS", "An order moved to a new status."],
          ["ORDER_MESSAGE", "A new message in an order's chat."],
          ["PAYMENT", "A payment or payout succeeded or failed."],
          ["ACCOUNT_SECURITY", "A password change, new sign-in, or similar."],
          ["PROMO", "Marketing / promotional content."],
          ["SELLER_ONBOARDING", "KYC and seller profile status updates."],
          ["SUPPORT", "Updates on a support conversation."],
          ["SYSTEM", "Platform-wide notices, e.g. incidents."],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Reading and managing</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        List a user&apos;s notifications (paginated, optionally filtered to unread), mark one or
        all as read, or delete one.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Delivery channels</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Every notification can go out over up to four channels — in-app, email, SMS, and push —
        independently controlled per notification type. A user reads their current settings with{" "}
        <Link href="/reference/get-notification-preferences" className="text-primary underline underline-offset-2">
          GET /preferences
        </Link>{" "}
        and changes one type&apos;s channels with{" "}
        <Link href="/reference/update-notification-preference" className="text-primary underline underline-offset-2">
          PUT /preferences
        </Link>{" "}
        (body: <code>{`{ type, inApp?, email?, sms?, push? }`}</code>). SMS defaults to off for
        every type; the others default to on.
      </p>

      <Callout variant="warning" title="ACCOUNT_SECURITY can't be muted">
        Security-relevant notifications force <strong className="font-medium text-foreground">all four channels</strong> on,
        regardless of saved preference — a user can&apos;t opt out of being told about a
        password change or new sign-in on their own account, and can&apos;t silence the SMS
        specifically while keeping email on.
      </Callout>
      <Callout variant="note" title="Security alerts also reach a secondary email">
        For <code>ACCOUNT_SECURITY</code> notifications specifically, delivery isn&apos;t limited
        to the primary address — a verified secondary email on the account receives the same
        email too. This is deliberate: if an attacker&apos;s first move is taking over the
        primary inbox, the account owner still sees the alert somewhere they control.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Staff-created notifications</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Admins can create a notification directly — used for one-off announcements outside the
        normal event-driven flow.
      </p>

      <Link
        href="/reference/list-notifications"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Notifications endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
