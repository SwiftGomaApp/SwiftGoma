import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { StepList } from "@/components/step-list";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Seller Profile" };

export default function SellerProfileGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Seller Profile</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        Before a SELLER account can create a shop or list products, it needs a seller
        profile — the business identity behind the shop, and the account{" "}
        <Link href="/docs/kyc" className="text-primary underline underline-offset-2">
          KYC
        </Link>{" "}
        attaches to. Every endpoint on this page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/seller
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Onboarding order</h2>
      <StepList
        steps={[
          {
            title: "Create the profile",
            body: (
              <>
                <Link href="/reference/create-seller-profile" className="text-primary underline underline-offset-2">
                  POST /
                </Link>{" "}
                with business details, a logo, and a banner. Created as <code>DRAFT</code>.
              </>
            ),
          },
          {
            title: "Submit KYC",
            body: (
              <>
                Covered in the{" "}
                <Link href="/docs/kyc" className="text-primary underline underline-offset-2">
                  KYC guide
                </Link>
                . The profile can&apos;t become active without it.
              </>
            ),
          },
          {
            title: "Profile activates automatically",
            body: "Once staff approve the KYC submission, the profile flips to ACTIVE in the same step — there's no separate activation call.",
          },
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Profile status</h2>
      <InfoTable
        columns={["Status", "Meaning"]}
        rows={[
          ["DRAFT", "Created, but KYC isn't approved yet. Editable."],
          ["ACTIVE", "KYC approved — can create shops and list products. Editable."],
          ["SUSPENDED", "Staff have disabled the account entirely. Not editable."],
        ]}
      />
      <Callout variant="warning" title="This suspension is account-wide">
        Suspending the seller profile is a different, broader action than suspending an
        individual shop — it blocks the seller from managing any of their shops or products at
        all, not just one storefront.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Reading and editing</h2>
      <InfoTable
        columns={["Action", "Endpoint"]}
        rows={[
          [
            "View my profile",
            <Link key="a" href="/reference/get-my-seller-profile" className="text-primary underline underline-offset-2">
              GET /my-profile
            </Link>,
          ],
          [
            "Edit my profile",
            <Link key="b" href="/reference/update-seller-profile" className="text-primary underline underline-offset-2">
              PUT /
            </Link>,
          ],
        ]}
      />
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">GET /my-profile</code> returns
        the profile alongside the seller&apos;s KYC status, subscription, wallet settings, shops,
        and recent invoices in one call — useful for a seller dashboard&apos;s initial load.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Staff actions</h2>
      <InfoTable
        columns={["Action", "Endpoint"]}
        rows={[
          [
            "Suspend",
            <Link key="a" href="/reference/suspend-seller-profile" className="text-primary underline underline-offset-2">
              POST /:userId/suspend
            </Link>,
          ],
          [
            "Reactivate",
            <Link key="b" href="/reference/reactivate-seller-profile" className="text-primary underline underline-offset-2">
              POST /:userId/reactivate
            </Link>,
          ],
        ]}
      />

      <Link
        href="/reference/create-seller-profile"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Seller Profile endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
