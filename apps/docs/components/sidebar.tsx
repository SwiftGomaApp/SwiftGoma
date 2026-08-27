"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { EndpointDoc } from "@/lib/types";
import { MethodBadge } from "@/components/method-badge";

export function Sidebar({
  sectionRoot,
  groups,
  topLabel = "Overview",
}: {
  sectionRoot: string;
  groups: { group: string; endpoints: EndpointDoc[] }[];
  topLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="scrollbar-thin sticky top-[6.5rem] h-[calc(100vh-6.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border px-3 py-6">
      <Link
        href={sectionRoot}
        className={cn(
          "mb-4 block rounded-md px-3 py-1.5 text-sm font-medium",
          pathname === sectionRoot
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {topLabel}
      </Link>

      {groups.map(({ group, endpoints }) => (
        <div key={group} className="mb-5">
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group}
          </p>
          <ul className="space-y-0.5">
            {endpoints.map((endpoint) => {
              const href = `${sectionRoot}/${endpoint.slug}`;
              const active = pathname === href;
              return (
                <li key={endpoint.slug}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <MethodBadge method={endpoint.method} size="sm" />
                    <span className="truncate">{endpoint.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
