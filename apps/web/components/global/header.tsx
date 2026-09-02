"use client";

import { Bell, Search, ShoppingCart, Menu, User, LogOut } from "lucide-react";
import Logo from "./logo";
import { DEFAULT_LOCALE, getClientLocale, type Locale } from "@/lib/language";
import { useAuth } from "@/lib/auth/auth-context";
import { useCart } from "@/lib/cart/cart-context";
import { useNotifications } from "@/lib/notifications/notifications-context";
import { ProductFilters } from "@/components/products/product-filters";
import { CartModal } from "@/components/global/cart-modal";
import { NotificationModal } from "@/components/global/notification-modal";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import type { PublicCategory } from "@/lib/api/routes/products";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "../ui/button";

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
    logout: string;
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
    logout: "Log out",
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
    logout: "Déconnexion",
  },
};

const Header = ({ categories = [] }: { categories?: PublicCategory[] }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { totalCount } = useCart();
  const { unreadCount } = useNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/auth/sign-in");
  };

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
          <nav className="hidden items-center gap-8 lg:flex">
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
              className="hidden h-9 items-center gap-2 rounded-full border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:flex"
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

            {/* Account dropdown (logged in) or Login button (logged out) */}
            {!isLoading &&
              (isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={t.account}
                    className="relative text-foreground transition-colors hover:text-primary"
                  >
                    <User size={20} strokeWidth={1.75} />
                    {(totalCount > 0 || unreadCount > 0) && (
                      <span className="absolute top-0 right-0 size-2 rounded-full bg-primary ring-2 ring-background" />
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={12}>
                    <DropdownMenuItem onClick={() => setCartOpen(true)}>
                      <ShoppingCart />
                      {t.cart}
                      {totalCount > 0 && (
                        <DropdownMenuShortcut>
                          {totalCount > 9 ? "9+" : totalCount}
                        </DropdownMenuShortcut>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setNotificationsOpen(true)}
                    >
                      <Bell />
                      {t.notifications}
                      {unreadCount > 0 && (
                        <DropdownMenuShortcut>
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </DropdownMenuShortcut>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/account" />}>
                      <User />
                      {t.account}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleLogout}
                    >
                      <LogOut />
                      {t.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  nativeButton={false}
                  render={<Link href="/auth/sign-in" />}
                >
                  {t.login}
                </Button>
              ))}

            {/* Hamburger — mobile only, opens the nav drawer */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    aria-label={t.openMenu}
                    className="text-foreground transition-colors hover:text-primary lg:hidden"
                  />
                }
              >
                <Menu size={22} strokeWidth={1.75} />
              </SheetTrigger>

              <SheetContent
                side="left"
                className="flex w-4/5 max-w-xs flex-col p-0"
              >
                <SheetHeader className="border-b border-border">
                  <SheetTitle className="sr-only">{t.menu}</SheetTitle>
                  <Logo size={18} />
                </SheetHeader>

                <nav className="flex flex-col gap-1 overflow-y-auto px-4 py-4">
                  {NAV_LINK_IDS.map((id) => (
                    <SheetClose
                      key={id}
                      nativeButton={false}
                      render={
                        <Link
                          href={NAV_HREFS[id]}
                          className="rounded-md px-3 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-muted"
                        />
                      }
                    >
                      {t.nav[id]}
                    </SheetClose>
                  ))}
                </nav>

                <div className="mt-auto border-t border-border p-4">
                  {!isLoading &&
                    (isAuthenticated ? (
                      <SheetClose
                        nativeButton={false}
                        render={
                          <Link
                            href="/account"
                            className="flex items-center gap-2 rounded-md px-3 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-muted"
                          />
                        }
                      >
                        <User size={18} strokeWidth={1.75} />
                        {t.account}
                      </SheetClose>
                    ) : (
                      <SheetClose
                        nativeButton={false}
                        render={
                          <Link
                            href="/auth/sign-in"
                            className={cn(buttonVariants(), "h-11 w-full")}
                          />
                        }
                      >
                        {t.login}
                      </SheetClose>
                    ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
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
