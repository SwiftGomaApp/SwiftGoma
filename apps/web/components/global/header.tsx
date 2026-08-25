"use client";

import { Bell, Search, ShoppingCart, X, Menu, User } from "lucide-react";
import Logo from "./logo";
import { DEFAULT_LOCALE, getClientLocale, type Locale } from "@/lib/language";
import { useAuth } from "@/lib/auth/auth-context";
import { useCart } from "@/lib/cart/cart-context";
import { useNotifications } from "@/lib/notifications/notifications-context";
import { ProductFilters } from "@/components/products/product-filters";
import { CartModal } from "@/components/global/cart-modal";
import { NotificationModal } from "@/components/global/notification-modal";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { PublicCategory } from "@/lib/api/routes/products";
import { useEffect, useState } from "react";
import Link from "next/link";

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
    cart: string;
    notifications: string;
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
    cart: "Cart",
    notifications: "Notifications",
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
    cart: "Panier",
    notifications: "Notifications",
    menu: "Menu",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    account: "Compte",
    login: "Connexion",
  },
};

const Header = ({ categories = [] }: { categories?: PublicCategory[] }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const { isAuthenticated, isLoading } = useAuth();
  const { totalCount } = useCart();
  const { unreadCount } = useNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setLocale(getClientLocale());
    setIsMac(/mac/i.test(navigator.platform || navigator.userAgent));
  }, []);

  // Cmd+K (Mac) / Ctrl+K (Windows/Linux) toggles the search dialog from anywhere.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const t = TRANSLATIONS[locale];

  return (
    <>
      <header className="sticky top-0 z-50 border-b backdrop-blur-sm border-border text-foreground">
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
            {/* Search trigger — pill with shortcut hint on larger screens */}
            <button
              aria-label={t.search}
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-border bg-muted/40 py-1.5 pr-2 pl-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:flex"
            >
              <Search size={16} strokeWidth={1.75} />
              <span>{t.search}</span>
              <KbdGroup>
                <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </button>

            {/* Search trigger — icon only on mobile, no keyboard shortcut to hint at */}
            <button
              aria-label={t.search}
              onClick={() => setSearchOpen(true)}
              className="text-foreground transition-colors hover:text-primary sm:hidden"
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

            {/* Notifications */}
            {isAuthenticated && (
              <button
                aria-label={t.notifications}
                onClick={() => setNotificationsOpen(true)}
                className="relative text-foreground transition-colors hover:text-primary"
              >
                <Bell size={20} strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Menu grid — desktop */}
            {/* Cart */}
            <button
              aria-label={t.cart}
              onClick={() => setCartOpen(true)}
              className="relative text-foreground transition-colors hover:text-primary"
            >
              <ShoppingCart size={20} strokeWidth={1.75} />
              {totalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {totalCount > 9 ? "9+" : totalCount}
                </span>
              )}
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

      <ProductFilters
        categories={categories}
        locale={locale}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        showTrigger={false}
        autoApply={false}
      />

      <CartModal open={cartOpen} onOpenChange={setCartOpen} locale={locale} />

      <NotificationModal
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        locale={locale}
      />
    </>
  );
};

export default Header;
