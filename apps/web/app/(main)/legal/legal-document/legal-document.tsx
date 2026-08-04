"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type LegalSection = {
  heading: string;
  body: string[];
};

type LegalDocumentProps = {
  titleFr: string;
  titleEn: string;
  lastUpdated: string;
  sectionsFr: LegalSection[];
  sectionsEn: LegalSection[];
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function DocumentContent({
  title,
  lastUpdatedLabel,
  lastUpdated,
  sections,
}: {
  title: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lastUpdatedLabel} {lastUpdated}
        </p>
      </div>

      <div className="flex flex-col gap-8 border-t border-border pt-8">
        {sections.map((section, i) => (
          <section
            key={i}
            id={slugify(section.heading)}
            className="scroll-mt-8"
          >
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {i + 1}. {section.heading}
            </h2>
            <div className="flex flex-col gap-3">
              {section.body.map((p, j) => (
                <p
                  key={j}
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function LegalDocument({
  titleFr,
  titleEn,
  lastUpdated,
  sectionsFr,
  sectionsEn,
}: LegalDocumentProps) {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [activeId, setActiveId] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  const sections = lang === "fr" ? sectionsFr : sectionsEn;
  const onThisPageLabel = lang === "fr" ? "Sur cette page" : "On this page";

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const headings = container.querySelectorAll("section[id]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "0px 0px -70% 0px",
        threshold: 0,
      },
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [lang, sections]);

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
      {/* Main content — Tabs live only here, TOC is outside their subtree */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Tabs value={lang} onValueChange={(v) => setLang(v as "fr" | "en")}>
          <TabsList className="mb-8">
            <TabsTrigger value="fr">Français</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
          </TabsList>

          <div ref={contentRef}>
            <TabsContent value="fr">
              <DocumentContent
                title={titleFr}
                lastUpdatedLabel="Dernière mise à jour :"
                lastUpdated={lastUpdated}
                sections={sectionsFr}
              />
            </TabsContent>

            <TabsContent value="en">
              <DocumentContent
                title={titleEn}
                lastUpdatedLabel="Last updated:"
                lastUpdated={lastUpdated}
                sections={sectionsEn}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* On this page — sibling of Tabs, not a descendant, so nothing inside Tabs can break its sticky positioning */}
      <aside className="hidden shrink-0 self-start lg:block lg:w-56">
        <div className="sticky top-12">
          <p className="mb-3 text-sm font-medium text-foreground">
            {onThisPageLabel}
          </p>
          <ol className="flex flex-col gap-1.5 border-l border-border pl-4">
            {sections.map((section, i) => {
              const id = slugify(section.heading);
              const isActive = activeId === id;
              return (
                <li key={i} className="-ml-px">
                  <a
                    href={`#${id}`}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "block border-l pl-4 text-sm transition-colors",
                      isActive
                        ? "border-primary font-medium text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {i + 1}. {section.heading}
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>
    </div>
  );
}
