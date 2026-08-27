import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Favorites</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        Lets a buyer save products for later. Every endpoint on this page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/favorites
        </code>{" "}
        and requires a signed-in session.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Listing</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">GET /</code> returns
        the buyer&apos;s favorited products with full{" "}
        <Link href="/docs/products" className="text-primary underline underline-offset-2">
          product
        </Link>{" "}
        detail, paginated.{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">GET /ids</code>{" "}
        returns just the product IDs — a lighter call for rendering favorite/unfavorite state
        across a product grid without fetching every product&apos;s full detail.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Adding and removing</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">POST /:productId</code>{" "}
        adds a product;{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">DELETE /:productId</code>{" "}
        removes it.
      </p>

      <Callout variant="note">
        Adding an already-favorited product, or removing one that isn&apos;t favorited, succeeds
        without error — both endpoints are idempotent.
      </Callout>

      <Link
        href="/reference/list-favorites"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Favorites endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
