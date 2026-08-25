import type { Metadata } from "next";

import { HELP_STRINGS } from "@/lib/constants/help";
import type { Locale } from "@/lib/language";
import HelpContent from "@/components/global/help-content";

const locale: Locale = "en";

export const metadata: Metadata = {
  title: `${HELP_STRINGS[locale].title} | Swiftgoma`,
  description: HELP_STRINGS[locale].subtitle,
};

export default function HelpPage() {
  const t = HELP_STRINGS[locale];

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            {t.eyebrow}
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.title}
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground">
            {t.subtitle}
          </p>
        </header>

        <HelpContent locale={locale} />

        <section className="mt-16 rounded-2xl border bg-muted/30 p-6 sm:p-8">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold tracking-tight">
              {t.stillNeedHelp}
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t.stillNeedHelpBody}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="/support"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {t.contactCta}
              </a>

              <a
                href="/legal/terms"
                className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                {t.browseLegal}
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
