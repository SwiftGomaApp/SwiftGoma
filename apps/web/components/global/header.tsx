"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, LayoutGrid, X, Menu, User } from "lucide-react";
import Logo from "./logo";
import { DEFAULT_LOCALE, getClientLocale, type Locale } from "@/lib/language";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ProductSearchCommand,
  type SearchProduct,
} from "./product-search-command";
import { MOCK_PRODUCTS } from "@/lib/mock-products";

const NAV_LINK_IDS = [
  "home",
  "about",
  "shops",
  "products",
  "categories",
] as const;
type NavLinkId = (typeof NAV_LINK_IDS)[number];

const NAV_HREFS: Record<NavLinkId, string> = {
  home: "/",
  about: "/about",
  shops: "/shops",
  products: "/products",
  categories: "/categories",
};

const TRANSLATIONS: Record<
  Locale,
  {
    nav: Record<NavLinkId, string>;
    search: string;
    menu: string;
    openMenu: string;
    closeMenu: string;
    account: string;
    login: string;
  }
> = {
  en: {
    nav: {
      home: "Home",
      about: "About Us",
      shops: "Shops",
      products: "Products",
      categories: "Categories",
    },
    search: "Search",
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    account: "Account",
    login: "Log in",
  },
  fr: {
    nav: {
      home: "Accueil",
      about: "À propos",
      shops: "Boutiques",
      products: "Produits",
      categories: "Catégories",
    },
    search: "Rechercher",
    menu: "Menu",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    account: "Compte",
    login: "Connexion",
  },
};

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const { isAuthenticated, isLoading } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const products: SearchProduct[] = [];

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = TRANSLATIONS[locale];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background text-foreground">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Logo size={18} />

          {/* Center nav — desktop only */}
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINK_IDS.map((id) => (
              <Link
                key={id}
                href={NAV_HREFS[id]}
                className="text-[15px] font-medium text-foreground transition-colors hover:text-primary"
              >
                {t.nav[id]}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4 sm:gap-5">
            <button
              aria-label={t.search}
              onClick={() => setSearchOpen(true)}
              className="text-foreground transition-colors hover:text-primary"
            >
              <Search size={20} strokeWidth={1.75} />
            </button>

            <span className="hidden h-6 w-px bg-border sm:block" />

            {/* Account (logged in) or Login button (logged out) */}
            {!isLoading &&
              (isAuthenticated ? (
                <Link
                  href="/account"
                  aria-label={t.account}
                  className="text-foreground transition-colors hover:text-primary"
                >
                  <User size={20} strokeWidth={1.75} />
                </Link>
              ) : (
                <Link
                  href="/auth/sign-in"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                >
                  {t.login}
                </Link>
              ))}

            {/* Menu grid — desktop */}
            <button
              aria-label={t.menu}
              className="hidden text-foreground transition-colors hover:text-primary sm:block"
            >
              <LayoutGrid size={20} strokeWidth={1.75} />
            </button>

            {/* Hamburger — mobile only, toggles nav */}
            <button
              aria-label={mobileOpen ? t.closeMenu : t.openMenu}
              onClick={() => setMobileOpen((v) => !v)}
              className="text-foreground transition-colors hover:text-primary md:hidden"
            >
              {mobileOpen ? (
                <X size={22} strokeWidth={1.75} />
              ) : (
                <Menu size={22} strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        {mobileOpen && (
          <nav className="flex flex-col gap-1 border-t border-border bg-background px-4 py-3 md:hidden">
            {NAV_LINK_IDS.map((id) => (
              <Link
                key={id}
                href={NAV_HREFS[id]}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-2 py-2.5 text-[15px] font-medium text-foreground transition-colors hover:bg-primary-foreground hover:text-primary"
              >
                {t.nav[id]}
              </Link>
            ))}

            <div className="mt-2 border-t border-border pt-3">
              {!isLoading &&
                (isAuthenticated ? (
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    <User size={18} strokeWidth={1.75} />
                    {t.account}
                  </Link>
                ) : (
                  <Link
                    href="/auth/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className="inline-block rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                  >
                    {t.login}
                  </Link>
                ))}
            </div>
          </nav>
        )}
      </header>

      <ProductSearchCommand
        open={searchOpen}
        onOpenChange={setSearchOpen}
        products={MOCK_PRODUCTS}
      />
    </>
  );
};

export default Header;
