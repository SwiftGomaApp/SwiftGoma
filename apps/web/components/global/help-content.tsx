"use client";

import { useMemo, useState } from "react";
import {
  Rocket,
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  Wallet,
  Search,
  MessageCircleQuestion,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

import {
  HELP_CATEGORIES,
  HELP_STRINGS,
  type HelpCategory,
} from "@/lib/constants/help";
import type { Locale } from "@/lib/language";

const ICONS: Record<
  HelpCategory["icon"],
  React.ComponentType<{ className?: string }>
> = {
  rocket: Rocket,
  "shopping-bag": ShoppingBag,
  store: Store,
  bike: Bike,
  shield: ShieldCheck,
  wallet: Wallet,
};

export default function HelpContent({ locale }: { locale: Locale }) {
  const t = HELP_STRINGS[locale];
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const filteredCategories = useMemo(() => {
    if (!isSearching) return HELP_CATEGORIES;

    return HELP_CATEGORIES.map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question[locale].toLowerCase().includes(normalizedQuery) ||
          faq.answer[locale].toLowerCase().includes(normalizedQuery),
      ),
    })).filter((category) => category.faqs.length > 0);
  }, [isSearching, normalizedQuery, locale]);

  const totalResults = filteredCategories.reduce(
    (sum, category) => sum + category.faqs.length,
    0,
  );

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          className="h-11 pl-9"
        />
      </div>

      {isSearching ? (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {t.resultsCount(totalResults)}
          </p>

          {filteredCategories.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageCircleQuestion />
                </EmptyMedia>
                <EmptyTitle>{t.noResultsTitle}</EmptyTitle>
                <EmptyDescription>{t.noResultsBody}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            filteredCategories.map((category) => {
              const Icon = ICONS[category.icon];
              return (
                <section key={category.id} className="space-y-2">
                  <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
                    <Icon className="size-4 text-muted-foreground" />
                    {category.label[locale]}
                  </h2>
                  <Accordion>
                    {category.faqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger>
                          {faq.question[locale]}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground">
                            {faq.answer[locale]}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              );
            })
          )}
        </div>
      ) : (
        <Tabs defaultValue={HELP_CATEGORIES[0].id}>
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {HELP_CATEGORIES.map((category) => {
              const Icon = ICONS[category.icon];
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="gap-1.5 rounded-full border border-border px-3.5 py-1.5 data-active:border-foreground/20 data-active:bg-primary data-active:text-background text-foreground"
                >
                  <Icon className="size-3.5" />
                  {category.label[locale]}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {HELP_CATEGORIES.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              <p className="mb-4 text-sm text-muted-foreground">
                {category.description[locale]}
              </p>
              <Accordion>
                {category.faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger>{faq.question[locale]}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">
                        {faq.answer[locale]}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
