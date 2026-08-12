import type { Metadata } from "next";
import { BRAND, SITE_URL } from "./brand";

export const DEFAULT_OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: `${BRAND.name} — Achetez, vendez, livrez`,
} as const;

export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export function absoluteUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function canonicalMetadata(path: string): Pick<Metadata, "alternates"> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return { alternates: { canonical: normalized } };
}

type PageSeoInput = {
  title: string;
  description?: string;
  path: string;
  openGraph?: Metadata["openGraph"];
  twitter?: Metadata["twitter"];
  robots?: Metadata["robots"];
};

export function buildPageMetadata({
  title,
  description = BRAND.description,
  path,
  openGraph,
  twitter,
  robots,
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    ...canonicalMetadata(path),
    openGraph: {
      type: "website",
      locale: BRAND.ogLocale,
      siteName: BRAND.name,
      title,
      description,
      url,
      images: [DEFAULT_OG_IMAGE],
      ...openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
      ...twitter,
    },
    robots,
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: SITE_URL,
    logo: absoluteUrl("/og-image.png"),
    email: BRAND.supportEmail,
    sameAs: Object.values(BRAND.social),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
