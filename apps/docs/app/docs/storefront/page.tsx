import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Storefront" };

export default function StorefrontGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Storefront</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        The hero carousel shown at the top of the SwiftGoma home page — a small, focused feature
        for platform-wide promotional slides.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Public read</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">
          GET /api/v1/storefront/hero
        </code>{" "}
        returns the active slides, ordered by <code>position</code>. No authentication required.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Admin management</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Everything under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/storefront/admin/hero-slides
        </code>{" "}
        is ADMIN-only: listing every slide including inactive ones, creating a slide (title,
        optional subtitle and link, position, an image upload), updating one, and deleting one.
        Setting <code>isActive</code> to <code>false</code> hides a slide from the public feed
        without deleting it.
      </p>

      <Link
        href="/reference/get-hero-slides"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Storefront endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
