"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE, getClientLocale, type Locale } from "@/lib/language";
import { LEGAL_NAV_ITEMS } from "@/lib/constants/legal";

/* ---------------------------------- Link groups ---------------------------------- */

const MARKETPLACE_LINK_IDS = [
  "home",
  "shops",
  "products",
  "categories",
] as const;
type MarketplaceLinkId = (typeof MARKETPLACE_LINK_IDS)[number];
const MARKETPLACE_HREFS: Record<MarketplaceLinkId, string> = {
  home: "/",
  shops: "/shops",
  products: "/products",
  categories: "/categories",
};

const COMPANY_LINK_IDS = [
  "about",
  "sellers",
  "contact",
] as const;
type CompanyLinkId = (typeof COMPANY_LINK_IDS)[number];
const COMPANY_HREFS: Record<CompanyLinkId, string> = {
  about: "/about",
  sellers: "/sell-on-swiftgoma",
  contact: "/contact",
};

const RESOURCES_LINK_IDS = [
  "help",
  "support",
  "blog",
  "terms",
  "privacy",
  "cookies",
] as const;
type ResourcesLinkId = (typeof RESOURCES_LINK_IDS)[number];
const RESOURCES_HREFS: Record<ResourcesLinkId, string> = {
  help: "/help",
  support: "/support",
  blog: "/blog",
  terms: "/legal/terms",
  privacy: "/legal/privacy",
  cookies: "/legal/cookies",
};

const BOTTOM_LEGAL_HREFS = ["/legal/terms", "/legal/privacy", "/legal/cookies"];
const BOTTOM_LEGAL_ITEMS = LEGAL_NAV_ITEMS.filter((item) =>
  BOTTOM_LEGAL_HREFS.includes(item.href),
);

/* ------------------------------------ Copy ------------------------------------ */

const TRANSLATIONS: Record<
  Locale,
  {
    tagline: string;
    marketplace: Record<MarketplaceLinkId, string> & { title: string };
    company: Record<CompanyLinkId, string> & { title: string };
    resources: Record<ResourcesLinkId, string> & { title: string };
    getTheApp: string;
    appStoreEyebrow: string;
    appStoreName: string;
    playStoreEyebrow: string;
    playStoreName: string;
    newsletterTitle: string;
    emailPlaceholder: string;
    subscribe: string;
    rights: string;
  }
> = {
  en: {
    tagline: "Local shopping in Goma, delivered.",
    marketplace: {
      title: "Marketplace",
      home: "Home",
      shops: "Shops",
      products: "Products",
      categories: "Categories",
    },
    company: {
      title: "Company",
      about: "About us",
      sellers: "Sell on SwiftGoma",
      contact: "Contact",
    },
    resources: {
      title: "Resources",
      help: "Help centre",
      blog: "Blog",
      support: "Support",
      terms: "Terms & Conditions",
      privacy: "Privacy",
      cookies: "Cookies",
    },
    getTheApp: "Get the app",
    appStoreEyebrow: "Download on the",
    appStoreName: "App Store",
    playStoreEyebrow: "GET IT ON",
    playStoreName: "Google Play",
    newsletterTitle: "Stay up to date",
    emailPlaceholder: "Enter your email",
    subscribe: "Subscribe",
    rights: "All rights reserved.",
  },
  fr: {
    tagline: "Le shopping local à Goma, livré chez vous.",
    marketplace: {
      title: "Marché",
      home: "Accueil",
      shops: "Boutiques",
      products: "Produits",
      categories: "Catégories",
    },
    company: {
      title: "Entreprise",
      about: "À propos",
      sellers: "Vendre sur SwiftGoma",
      contact: "Contact",
    },
    resources: {
      title: "Ressources",
      help: "Centre d'aide",
      blog: "Blog",
      support: "Assistance",
      terms: "Conditions générales",
      privacy: "Confidentialité",
      cookies: "Cookies",
    },
    getTheApp: "Obtenir l'application",
    appStoreEyebrow: "Télécharger sur",
    appStoreName: "l'App Store",
    playStoreEyebrow: "DISPONIBLE SUR",
    playStoreName: "Google Play",
    newsletterTitle: "Restez informé",
    emailPlaceholder: "Entrez votre email",
    subscribe: "S'abonner",
    rights: "Tous droits réservés.",
  },
};

/* ------------------------------------ Icons ------------------------------------ */

const AppleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M16.365 1.43c0 1.14-.415 2.06-1.246 2.76-.859.72-1.879 1.14-2.86 1.06a3.1 3.1 0 0 1-.03-.4c0-1.1.478-2.14 1.28-2.86.83-.76 2.03-1.13 2.83-1.19.02.21.026.42.026.63Zm4.106 15.36c-.53 1.22-.79 1.77-1.47 2.85-.95 1.5-2.29 3.37-3.95 3.39-1.48.02-1.86-.97-3.87-.96-2.01.01-2.43.98-3.9.96-1.66-.02-2.93-1.71-3.88-3.21-2.66-4.2-2.94-9.13-1.3-11.75 1.16-1.86 2.99-2.95 4.71-2.95 1.75 0 2.85 1 4.3 1 1.4 0 2.26-1 4.3-1 1.53 0 3.16.83 4.32 2.27-3.8 2.08-3.18 7.5.72 9.15Z" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      d="M4.4 2.6c-.4.3-.6.8-.6 1.4v16c0 .6.2 1.1.6 1.4l.1.1L13.6 12v-.2L4.5 2.5l-.1.1Z"
      fill="#00D6FF"
    />
    <path
      d="m16.6 15 -3-3v-.2l3-3 .1.1 3.6 2c1 .6 1 1.5 0 2.1l-3.6 2Z"
      fill="#FFCF00"
    />
    <path
      d="M16.6 15 13.6 12 4.4 21.4c.35.36.93.4 1.58.05L16.6 15Z"
      fill="#FF3363"
    />
    <path
      d="M16.6 9 5.98 2.55c-.65-.35-1.23-.3-1.58.05L13.6 12 16.6 9Z"
      fill="#00F076"
    />
  </svg>
);

const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M16.7 2h-3.3v13.9c0 1.5-1.2 2.7-2.7 2.7a2.7 2.7 0 0 1-2.7-2.7 2.7 2.7 0 0 1 2.7-2.7c.3 0 .6.05.9.13V9.9a6 6 0 0 0-.9-.07A6.05 6.05 0 0 0 4.7 15.9a6.05 6.05 0 0 0 6.05 6.05 6.05 6.05 0 0 0 6.05-6.05V8.6a8.3 8.3 0 0 0 4.5 1.32V6.6a5 5 0 0 1-4.6-4.6Z" />
  </svg>
);

const FacebookIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M13.5 21.5v-8.2h2.75l.41-3.2h-3.16V8.05c0-.93.26-1.56 1.59-1.56h1.7V3.6c-.29-.04-1.3-.13-2.47-.13-2.44 0-4.11 1.49-4.11 4.22v2.35H7.45v3.2h2.76v8.2h3.29Z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9C2 8.9 2 12 2 12s0 3.1.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8ZM10 15V9l5.2 3-5.2 3Z" />
  </svg>
);

const SOCIAL_LINKS = [
  {
    id: "instagram",
    href: "https://instagram.com/swiftgoma",
    label: "Instagram",
    Icon: InstagramIcon,
  },
  {
    id: "tiktok",
    href: "https://tiktok.com/@swiftgoma",
    label: "TikTok",
    Icon: TikTokIcon,
  },
  {
    id: "facebook",
    href: "https://facebook.com/swiftgoma",
    label: "Facebook",
    Icon: FacebookIcon,
  },
  {
    id: "youtube",
    href: "https://youtube.com/@swiftgoma",
    label: "YouTube",
    Icon: YoutubeIcon,
  },
] as const;

/* ------------------------------------ Footer ------------------------------------ */

const Footer = () => {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = TRANSLATIONS[locale];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up to newsletter endpoint
    setEmail("");
  };

  return (
    <footer className="border-t px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl p-6 sm:p-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Logo size={25} />
            <p className="mt-3 max-w-55 text-sm text-muted-foreground">
              {t.tagline}
            </p>
          </div>

          {/* Marketplace */}
          <nav>
            <h3 className="text-sm font-semibold text-foreground">
              {t.marketplace.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {MARKETPLACE_LINK_IDS.map((id) => (
                <li key={id}>
                  <Link
                    href={MARKETPLACE_HREFS[id]}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {t.marketplace[id]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav>
            <h3 className="text-sm font-semibold text-foreground">
              {t.company.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {COMPANY_LINK_IDS.map((id) => (
                <li key={id}>
                  <Link
                    href={COMPANY_HREFS[id]}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {t.company[id]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav>
            <h3 className="text-sm font-semibold text-foreground">
              {t.resources.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {RESOURCES_LINK_IDS.map((id) => (
                <li key={id}>
                  <Link
                    href={RESOURCES_HREFS[id]}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {t.resources[id]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Get the app + newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t.getTheApp}
            </h3>
            <div className="mt-4 flex gap-2">
              <a
                href="#"
                aria-label={`${t.appStoreEyebrow} ${t.appStoreName}`}
                className="flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-background transition-opacity hover:opacity-85"
              >
                <AppleIcon />
                <span className="leading-tight">
                  <span className="block text-xs font-semibold">
                    {t.appStoreName}
                  </span>
                </span>
              </a>

              <a
                href="#"
                aria-label={`${t.playStoreEyebrow} ${t.playStoreName}`}
                className="flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-background transition-opacity hover:opacity-85"
              >
                <PlayIcon />
                <span className="leading-tight">
                  <span className="block text-xs font-semibold">
                    {t.playStoreName}
                  </span>
                </span>
              </a>
            </div>

            <h3 className="mt-6 text-sm font-semibold text-foreground">
              {t.newsletterTitle}
            </h3>
            <form
              onSubmit={handleSubscribe}
              className="mt-3 flex flex-col gap-2"
            >
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                aria-label={t.emailPlaceholder}
              />
              <Button type="submit" className="w-full">
                {t.subscribe}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col-reverse items-center gap-6 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(({ id, href, label, Icon }) => (
              <a
                key={id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-85"
              >
                <Icon />
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {BOTTOM_LEGAL_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label[locale]}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground sm:text-left">
          © {new Date().getFullYear()} SwiftGoma. {t.rights}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
