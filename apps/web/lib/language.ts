export const SUPPORTED_LOCALES = ["en", "fr"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

function isSupportedLocale(lang: string): lang is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(lang);
}

export function parseAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const parsed = header
    .split(",")
    .map((part) => {
      const [rawLang, qPart] = part.trim().split(";q=");
      const lang = rawLang.split("-")[0].toLowerCase();
      const q = qPart ? parseFloat(qPart) : 1;
      return { lang, q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of parsed) {
    if (isSupportedLocale(lang)) return lang;
  }

  return DEFAULT_LOCALE;
}

export async function getServerLocale(): Promise<Locale> {
  const { headers } = await import("next/headers");
  const headerList = await headers();
  return parseAcceptLanguage(headerList.get("accept-language"));
}

export function getClientLocale(): Locale {
  if (typeof window === "undefined" || !navigator?.language) {
    return DEFAULT_LOCALE;
  }

  const lang = navigator.language.split("-")[0].toLowerCase();
  return isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
}
