import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Support" };

export default function SupportGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Support</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        The public contact form, and staff tools to triage what comes in. Every endpoint on this
        page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/support
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Submitting a message</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">
          POST /contact
        </code>{" "}
        requires no authentication — anyone can submit a name, email, subject category, and
        message. New messages start with status <code>OPEN</code>.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Staff triage</h2>
      <InfoTable
        columns={["Status", "Meaning"]}
        rows={[
          ["OPEN", "Unclaimed, waiting for a staff member."],
          ["ASSIGNED", "A staff member has claimed it."],
          ["CLOSED", "Resolved."],
        ]}
      />
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Staff (ADMIN or SUPPORT) can list and inspect messages, claim one for themselves with{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">
          POST /messages/:id/assign-me
        </code>
        , and update status or attach internal notes.
      </p>

      <Callout variant="tip">
        Assigning is self-service — there&apos;s no endpoint to assign a message to someone else,
        by design. A staff member claims a message, they don&apos;t hand it off through the API.
      </Callout>

      <Link
        href="/reference/submit-contact-message"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Support endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
