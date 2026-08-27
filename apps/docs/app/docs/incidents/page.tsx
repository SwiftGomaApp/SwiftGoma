import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Incidents" };

export default function IncidentsGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Incidents</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        Powers a public platform status page — outages, degradations, and their resolution.
        Every endpoint on this page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/incidents
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Public feed</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">GET /</code> lists
        incidents most-recent-first, no authentication required.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Severity and status</h2>
      <InfoTable
        columns={["Severity", "Status"]}
        rows={[
          ["MINOR", "INVESTIGATING"],
          ["MAJOR", "IDENTIFIED"],
          ["CRITICAL", "MONITORING"],
          ["—", "RESOLVED"],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Staff management</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        ADMIN and SUPPORT can open a new incident (title up to 200 characters, description up to
        5000), update its description or severity, and update its status. Creating an incident,
        or changing its status, broadcasts a{" "}
        <Link href="/docs/notifications" className="text-primary underline underline-offset-2">
          SYSTEM notification
        </Link>
        .
      </p>

      <Callout variant="note">
        Two endpoints touch status: the general update endpoint accepts it as one of several
        fields, but the dedicated{" "}
        <code className="rounded bg-background/80 px-1 py-0.5 font-mono text-[13px]">
          PATCH /:id/status
        </code>{" "}
        endpoint is the one that triggers the notification — prefer it when status is the only
        thing changing.
      </Callout>

      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Moving status to <code>RESOLVED</code> stamps a <code>resolvedAt</code> timestamp; moving
        it back off <code>RESOLVED</code> clears that timestamp.
      </p>

      <Link
        href="/reference/list-incidents"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Incidents endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
