"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE, getClientLocale, type Locale } from "@/lib/language";
import { LEGAL_NAV_ITEMS } from "@/lib/constants/legal";
import { ComingSoonDialog } from "@/components/global/coming-soon-dialog";
import {
  AppleIcon,
  FacebookIcon,
  InstagramIcon,
  PlayIcon,
  TikTokIcon,
  WhatsappIcon,
  YoutubeIcon,
} from "./icons";

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

const COMPANY_LINK_IDS = ["about", "sellers", "contact"] as const;
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
    comingSoonTitle: string;
    comingSoonDescription: string;
    comingSoonClose: string;
    waitlistPlaceholder: string;
    waitlistSubmit: string;
    waitlistSubmitting: string;
    waitlistSuccessTitle: string;
    waitlistSuccessDescription: string;
    waitlistError: string;
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
    comingSoonTitle: "Coming soon",
    comingSoonDescription:
      "Our mobile app isn't available yet. We'll let you know as soon as it launches.",
    comingSoonClose: "Got it",
    waitlistPlaceholder: "you@example.com",
    waitlistSubmit: "Notify me",
    waitlistSubmitting: "Submitting…",
    waitlistSuccessTitle: "You're on the list!",
    waitlistSuccessDescription: "We'll email you as soon as the app launches.",
    waitlistError: "Something went wrong. Please try again.",
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
    comingSoonTitle: "Bientôt disponible",
    comingSoonDescription:
      "Notre application mobile n'est pas encore disponible. Nous vous préviendrons dès son lancement.",
    comingSoonClose: "Compris",
    waitlistPlaceholder: "vous@exemple.com",
    waitlistSubmit: "Me prévenir",
    waitlistSubmitting: "Envoi…",
    waitlistSuccessTitle: "Vous êtes sur la liste !",
    waitlistSuccessDescription:
      "Nous vous enverrons un e-mail dès le lancement de l'application.",
    waitlistError: "Une erreur est survenue. Veuillez réessayer.",
  },
};

/* ------------------------------------ Icons ------------------------------------ */

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
  {
    id: "whatsapp",
    href: "https://chat.whatsapp.com/Edhnp2gxeCgH400avp0kWU?mode=gi_t",
    label: "WhatsApp",
    Icon: WhatsappIcon,
  },
] as const;

/* ------------------------------------ Footer ------------------------------------ */

const Footer = () => {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [email, setEmail] = useState("");
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

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
            <Logo size={20} />
            <p className="mt-3 text-sm text-muted-foreground">{t.tagline}</p>
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
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
              <button
                type="button"
                onClick={() => setComingSoonOpen(true)}
                aria-label={`${t.appStoreEyebrow} ${t.appStoreName}`}
                className="flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-background transition-opacity hover:opacity-85"
              >
                <AppleIcon />
                <span className="leading-tight">
                  <span className="block text-xs font-semibold">
                    {t.appStoreName}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setComingSoonOpen(true)}
                aria-label={`${t.playStoreEyebrow} ${t.playStoreName}`}
                className="flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-background transition-opacity hover:opacity-85"
              >
                <PlayIcon />
                <span className="leading-tight">
                  <span className="block text-xs font-semibold">
                    {t.playStoreName}
                  </span>
                </span>
              </button>
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

      <ComingSoonDialog
        open={comingSoonOpen}
        onOpenChange={setComingSoonOpen}
        title={t.comingSoonTitle}
        description={t.comingSoonDescription}
        closeLabel={t.comingSoonClose}
        emailPlaceholder={t.waitlistPlaceholder}
        submitLabel={t.waitlistSubmit}
        submittingLabel={t.waitlistSubmitting}
        successTitle={t.waitlistSuccessTitle}
        successDescription={t.waitlistSuccessDescription}
        errorMessage={t.waitlistError}
        onSubmitEmail={async (email) => {
          // TODO: wire up to your waitlist endpoint once it exists
          console.log("Waitlist signup:", email);
        }}
      />
    </footer>
  );
};

export default Footer;
