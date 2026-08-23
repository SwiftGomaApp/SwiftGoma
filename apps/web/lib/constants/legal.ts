import { Locale } from "@/lib/language";

export type LegalNavItem = {
  href: string;
  label: Record<Locale, string>;
};

export const LEGAL_NAV_ITEMS: LegalNavItem[] = [
  {
    href: "/legal/terms",
    label: { en: "Terms & Conditions", fr: "Conditions générales" },
  },
  {
    href: "/legal/privacy",
    label: { en: "Privacy", fr: "Confidentialité" },
  },
  {
    href: "/legal/seller-terms",
    label: {
      en: "Seller Terms & Conditions",
      fr: "Conditions vendeur",
    },
  },
  {
    href: "/legal/buyer-terms",
    label: {
      en: "Buyer Terms & Conditions",
      fr: "Conditions acheteur",
    },
  },
  {
    href: "/legal/rider-terms",
    label: {
      en: "Rider Terms & Conditions",
      fr: "Conditions livreur",
    },
  },
  {
    href: "/legal/cookies",
    label: { en: "Cookies", fr: "Cookies" },
  },
];

export const LEGAL_STRINGS = {
  en: {
    onThisPage: "On this page",
  },
  fr: {
    onThisPage: "Sur cette page",
  },
} as const satisfies Record<Locale, Record<string, string>>;
