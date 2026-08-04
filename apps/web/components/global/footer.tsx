// components/layout/footer.tsx
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import Logo from "./logo";

const EXPLORE_LINKS = [
  { href: "/products", label: "Produits" },
  { href: "/shops", label: "Boutiques" },
  { href: "/categories", label: "Catégories" },
  { href: "/blog", label: "Blog" },
  { href: "/help", label: "Aide" },
  { href: "/status", label: "Statut" },
];

const SELLER_LINKS = [
  { href: "/sell", label: "Vendre sur SwiftGoma" },
  { href: "/legal/seller-terms", label: "Conditions Vendeurs" },
  { href: "/legal/delivery-terms", label: "Conditions Livreurs" },
];

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Conditions générales" },
  { href: "/legal/buyer-terms", label: "Conditions Acheteurs" },
  { href: "/legal/privacy", label: "Confidentialité" },
  { href: "/legal/cookies", label: "Cookies" },
];

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.256 1.216.6 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.25a3.25 3.25 0 1 1 0-6.5 3.25 3.25 0 0 1 0 6.5zm5.25-9.375a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25z" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { href: "https://facebook.com", label: "Facebook", icon: FacebookIcon },
  { href: "https://instagram.com", label: "Instagram", icon: InstagramIcon },
  { href: "https://twitter.com", label: "X (Twitter)", icon: XIcon },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-4 lg:col-span-2">
            <Logo size={20} />

            <p className="max-w-xs text-sm text-muted-foreground">
              La marketplace qui connecte acheteurs, vendeurs et livreurs pour
              des achats en ligne rapides et sécurisés en RDC et au Rwanda.
            </p>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a
                href="mailto:support@swiftgoma.com"
                className="flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                support@swiftgoma.com
              </a>

              <a
                href={`https://wa.me/243855078387?text=${encodeURIComponent(
                  "Bonjour, j'ai une question concernant SwiftGoma.",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <Phone className="h-4 w-4" />
                WhatsApp: +243 855 078 387
              </a>

              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Goma, RD Congo
              </span>
            </div>
          </div>

          {/* Explore */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Explorer</h3>

            <ul className="flex flex-col gap-2">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sellers */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Vendeurs & Livreurs
            </h3>

            <ul className="flex flex-col gap-2">
              {SELLER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Légal</h3>

            <ul className="flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SwiftGoma. Tous droits réservés.
          </p>

          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => {
              const Icon = social.icon;

              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
