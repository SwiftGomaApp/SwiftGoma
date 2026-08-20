"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LEGAL_STRINGS } from "@/lib/constants/legal";
import { Locale } from "@/lib/language";
import { cn } from "@/lib/utils";

const CONTENT_ID = "legal-content";
const HEADING_SELECTOR = "h2, h3";

type Heading = {
  id: string;
  text: string;
  level: number;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function TableOfContents({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const t = LEGAL_STRINGS[locale];

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const container = document.getElementById(CONTENT_ID);
      if (!container) {
        setHeadings([]);
        return;
      }

      const elements = Array.from(
        container.querySelectorAll<HTMLHeadingElement>(HEADING_SELECTOR),
      );

      const seenIds = new Set<string>();
      const nextHeadings = elements.map((el) => {
        if (!el.id) {
          let id = slugify(el.textContent || "");
          let suffix = 1;
          while (!id || seenIds.has(id)) {
            id = `${slugify(el.textContent || "")}-${suffix}`;
            suffix += 1;
          }
          el.id = id;
        }
        seenIds.add(el.id);

        return {
          id: el.id,
          text: el.textContent || "",
          level: el.tagName === "H2" ? 2 : 3,
        };
      });

      setHeadings(nextHeadings);
      setActiveId(nextHeadings[0]?.id ?? null);
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (headings.length === 0) return;

    const container = document.getElementById(CONTENT_ID);
    const scrollRoot = container?.closest("[data-slot='scroll-area-viewport']");

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: scrollRoot instanceof Element ? scrollRoot : null,
        rootMargin: "0px 0px -70% 0px",
        threshold: 0,
      },
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label={t.onThisPage} className="flex flex-col gap-1">
      <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t.onThisPage}
      </p>

      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            heading.level === 3 && "ml-3",
            activeId === heading.id
              ? "font-medium text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}
