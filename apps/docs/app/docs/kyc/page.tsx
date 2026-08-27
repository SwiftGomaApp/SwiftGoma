import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { StepList } from "@/components/step-list";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Seller KYC" };

export default function KycGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Seller KYC</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        Identity verification for sellers, sitting between{" "}
        <Link href="/docs/seller-profile" className="text-primary underline underline-offset-2">
          creating a seller profile
        </Link>{" "}
        and it becoming ACTIVE. Every endpoint on this page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/seller/kyc
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Before submitting</h2>
      <Callout variant="warning" title="Two prerequisites">
        The seller&apos;s phone number must already be verified, and they need at least one
        verified email address — see the{" "}
        <Link href="/docs/users" className="text-primary underline underline-offset-2">
          Users guide
        </Link>
        . Submission is rejected outright if either is missing.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Required documents</h2>
      <InfoTable
        columns={["Document", "Format", "Required"]}
        rows={[
          ["ID document", "Image or PDF — national ID, voter card, or passport", "Always"],
          ["Proof of address", "Image or PDF", "Always"],
          ["Selfie", "Image only", "Always"],
          ["RCCM number + document", "Business registration", "Both together, or neither"],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Review flow</h2>
      <StepList
        steps={[
          {
            title: "Seller submits",
            body: (
              <>
                <Link href="/reference/submit-kyc" className="text-primary underline underline-offset-2">
                  POST /
                </Link>{" "}
                — one submission per profile. Status starts at <code>PENDING</code>.
              </>
            ),
          },
          {
            title: "Support reviews",
            body: (
              <>
                Typically after a verification call.{" "}
                <Link href="/reference/support-review-kyc" className="text-primary underline underline-offset-2">
                  POST /:id/support-review
                </Link>{" "}
                with call notes moves it to <code>SUPPORT_REVIEWED</code> and notifies admins.
              </>
            ),
          },
          {
            title: "Admin gives final approval",
            body: (
              <>
                <Link href="/reference/approve-kyc" className="text-primary underline underline-offset-2">
                  POST /:id/approve
                </Link>{" "}
                moves it to <code>APPROVED</code> and activates the seller profile in the same
                step.
              </>
            ),
          },
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Status transitions</h2>
      <InfoTable
        columns={["From", "Can move to"]}
        rows={[
          ["PENDING", "SUPPORT_REVIEWED, REJECTED"],
          ["SUPPORT_REVIEWED", "APPROVED, REJECTED"],
          ["REJECTED", "PENDING — via resubmission"],
          ["APPROVED", "— terminal"],
        ]}
      />
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        A rejected submission can be fixed and sent back with{" "}
        <Link href="/reference/resubmit-kyc" className="text-primary underline underline-offset-2">
          POST /resubmit
        </Link>{" "}
        — only the documents that need replacing have to be included; anything omitted keeps
        its previous value.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Why Support and Admin are split</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Support can review and reject, but only ADMIN can give final approval — a
        maker-checker split so no single support agent can activate a seller account
        unilaterally.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Staff lookup</h2>
      <InfoTable
        columns={["Action", "Endpoint"]}
        rows={[
          [
            "List submissions",
            <Link key="a" href="/reference/list-kyc" className="text-primary underline underline-offset-2">
              GET /
            </Link>,
          ],
          [
            "Get one submission's detail",
            <Link key="b" href="/reference/get-kyc-detail" className="text-primary underline underline-offset-2">
              GET /:id
            </Link>,
          ],
        ]}
      />
      <Callout variant="note">
        KYC detail includes the seller&apos;s linked account info for review — sensitive fields
        like passwords and verification codes are stripped before it&apos;s returned.
      </Callout>

      <Link
        href="/reference/submit-kyc"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the KYC endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
