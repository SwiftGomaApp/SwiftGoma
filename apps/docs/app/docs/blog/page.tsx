import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";

export const metadata: Metadata = { title: "Blog" };

export default function BlogGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Blog</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        Editorial content published on the SwiftGoma site. Every endpoint on this page lives
        under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/blog
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Public reading</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">GET /</code> lists
        published posts;{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">
          GET /slug/:slug
        </code>{" "}
        returns one by its slug. Both are public and only ever return posts with status{" "}
        <code>PUBLISHED</code>.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Staff authoring</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        ADMIN and SUPPORT can list and fetch posts of any status (for drafting), create a post
        with a title, excerpt, HTML content, an optional cover image, and a{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">DRAFT</code> or{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">PUBLISHED</code>{" "}
        status, update any of those fields later, and delete a post.
      </p>

      <Callout variant="note">
        Updating a post can replace its cover image with a new upload, or remove it entirely with
        the <code className="rounded bg-background/80 px-1 py-0.5 font-mono text-[13px]">removeCoverImage</code> flag — without either, the existing image is left untouched.
      </Callout>

      <Link
        href="/reference/list-blog-posts"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Blog endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
