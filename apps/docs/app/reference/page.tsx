import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { groupedEndpoints } from "@/lib/combined-endpoints";
import { MethodBadge } from "@/components/method-badge";

export const metadata: Metadata = { title: "API Reference" };

export default function ReferenceIndexPage() {
  const groups = groupedEndpoints();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Reference</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">API Reference</h1>
      <p className="mb-10 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        Every endpoint on the SwiftGoma API — grouped the same way as the sidebar. See the{" "}
        <Link href="/docs" className="text-primary underline underline-offset-2">
          API docs
        </Link>{" "}
        for narrative guides on how authentication and user management fit together.
      </p>

      {groups.map(({ group, endpoints }) => (
        <div key={group} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">{group}</h2>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {endpoints.map((endpoint) => (
              <Link
                key={endpoint.slug}
                href={`/reference/${endpoint.slug}`}
                className="group flex items-center gap-3 px-4 py-3 transition hover:bg-muted"
              >
                <MethodBadge method={endpoint.method} size="sm" />
                <code className="hidden font-mono text-xs text-muted-foreground sm:inline">
                  {endpoint.path.replace("/api/v1", "")}
                </code>
                <span className="ml-auto text-sm font-medium">{endpoint.title}</span>
                <ArrowRight
                  size={14}
                  className="text-muted-foreground opacity-0 transition group-hover:opacity-100"
                />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
