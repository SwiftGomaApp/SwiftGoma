"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MethodBadge } from "@/components/method-badge";
import { groupedEndpoints } from "@/lib/combined-endpoints";

const GROUPS = groupedEndpoints().filter((g) => g.endpoints.length > 0);

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((value) => !value);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const onSelect = useCallback(
    (slug: string) => {
      setOpen(false);
      router.push(`/reference/${slug}`);
    },
    [router],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground md:flex"
      >
        <Search size={14} />
        <span>Search endpoints…</span>
        <kbd className="ml-6 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search endpoints"
        description="Jump to any API endpoint by name, method, or path"
        className="max-w-xl"
      >
        <CommandInput placeholder="Search endpoints by name, method, or path…" />
        <CommandList>
          <CommandEmpty>No endpoints found.</CommandEmpty>
          {GROUPS.map(({ group, endpoints }) => (
            <CommandGroup key={group} heading={group}>
              {endpoints.map((endpoint) => (
                <CommandItem
                  key={endpoint.slug}
                  value={`${endpoint.method} ${endpoint.title} ${endpoint.path} ${endpoint.group}`}
                  onSelect={() => onSelect(endpoint.slug)}
                >
                  <MethodBadge method={endpoint.method} size="sm" />
                  <span className="flex-1 truncate">{endpoint.title}</span>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {endpoint.path}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
