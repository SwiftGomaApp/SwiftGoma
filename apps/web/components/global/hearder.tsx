// components/global/hearder.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  ShoppingCart,
  User as UserIcon,
  Settings,
  SlidersHorizontal,
  LogOut,
  Menu,
  Heart,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ProductFilters } from "@/components/filters/product-filters";
import { Kbd } from "@/components/ui/kbd";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { NotificationsModal } from "@/components/global/notifications-modal";
import { notificationsApi } from "@/lib/api/routes/notifications";
import Logo from "./logo";

const NAV_LINKS_BEFORE_CATEGORIES = [
  { href: "/", label: "Accueil" },
  { href: "/products", label: "Produits" },
  { href: "/shops", label: "Boutiques" },
];

const NAV_LINKS_AFTER_CATEGORIES = [{ href: "/help", label: "Aide" }];

type Subcategory = {
  id: string;
  name: string;
  slug: string;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  subcategories: Subcategory[];
};

type HeaderProps = {
  categories: Category[];
};

function categoryDescription(subcategories: Subcategory[]) {
  if (subcategories.length === 0) return undefined;
  const names = subcategories.map((s) => s.name);
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} et plus`;
}

function UserAvatar({
  avatarUrl,
  size = 20,
}: {
  avatarUrl: string | null | undefined;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <span
        className="relative shrink-0 overflow-hidden rounded-full"
        style={{ width: size, height: size }}
      >
        <Image
          src={avatarUrl}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </span>
    );
  }
  return <UserIcon className="h-5 w-5" />;
}

export function Header({ categories }: HeaderProps) {
  const router = useRouter();
  const { user, isLoading, isLoggingOut, logout } = useAuth();
  const { totalItemCount, openCart } = useCart();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setFiltersOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!user) return;
    notificationsApi
      .list({ limit: 1 })
      .then((result) => setUnreadCount(result.unreadCount))
      .catch(() => {});
  }, [user]);

  async function handleLogout() {
    if (isLoggingOut) return;
    await logout();
    setMobileMenuOpen(false);
    toast.success("Vous êtes déconnecté.");
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 py-4">
        <Logo size={18} />

        {/* Nav — centered, desktop only */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {NAV_LINKS_BEFORE_CATEGORIES.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink
                  render={<Link href={link.href} />}
                  className={navigationMenuTriggerStyle()}
                >
                  {link.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}

            <NavigationMenuItem>
              <NavigationMenuTrigger>Catégories</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-140 grid-cols-2 gap-1 p-2">
                  {categories.map((category) => {
                    const description = categoryDescription(
                      category.subcategories,
                    );
                    return (
                      <li key={category.id}>
                        <NavigationMenuLink
                          render={
                            <Link href={`/categories/${category.slug}`} />
                          }
                          className="flex flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-foreground transition-colors hover:bg-muted"
                        >
                          <span className="text-sm font-medium">
                            {category.name}
                          </span>
                          {description && (
                            <span className="line-clamp-1 text-xs text-muted-foreground">
                              {description}
                            </span>
                          )}
                        </NavigationMenuLink>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-border p-2">
                  <NavigationMenuLink
                    render={<Link href="/categories" />}
                    className="block rounded-md px-3 py-2 text-center text-sm font-medium text-primary hover:bg-muted"
                  >
                    Voir toutes les catégories
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {NAV_LINKS_AFTER_CATEGORIES.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink
                  render={<Link href={link.href} />}
                  className={navigationMenuTriggerStyle()}
                >
                  {link.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          {/* Filters — icon only on mobile, full "Filtrer ⌘K" on sm+ */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
                />
              }
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filtrer</span>
              <Kbd className="ml-2">⌘K</Kbd>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <ProductFilters onApply={() => setFiltersOpen(false)} />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Filtrer les produits"
            className="sm:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>

          {/* Desktop auth */}
          <div className="hidden md:block">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Mon compte"
                      className="relative"
                    />
                  }
                >
                  <UserAvatar avatarUrl={user.avatarUrl} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex items-center gap-2 truncate">
                      <UserAvatar avatarUrl={user.avatarUrl} size={20} />
                      <span className="truncate">{user.name}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <NotificationsModal
                      unreadCount={unreadCount}
                      onUnreadCountChange={setUnreadCount}
                      className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted"
                    />
                    <DropdownMenuItem onClick={openCart}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Panier
                      {totalItemCount > 0 && (
                        <span className="ml-auto rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                          {totalItemCount}
                        </span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/orders" />}>
                      <Package className="mr-2 h-4 w-4" />
                      Mes commandes
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/account/profile" />}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link href="/account/favorites" />}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Favoris
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link href="/account/settings" />}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                render={<Link href="/auth/sign-in" />}
                nativeButton={false}
                size="sm"
              >
                Connexion
              </Button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Menu"
                  className="md:hidden"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full flex-col sm:max-w-sm"
            >
              <div className="flex flex-col gap-6 overflow-y-auto p-6">
                <Logo size={18} />

                {/* Nav links */}
                <nav className="flex flex-col gap-1">
                  {NAV_LINKS_BEFORE_CATEGORIES.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {NAV_LINKS_AFTER_CATEGORIES.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                {/* Categories */}
                <div className="flex flex-col gap-1 border-t border-border pt-4">
                  <span className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                    Catégories
                  </span>
                  {categories.map((category) => (
                    <details key={category.id} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-2 text-sm text-foreground marker:content-none hover:bg-muted">
                        {category.name}
                        {category.subcategories.length > 0 && (
                          <span className="text-muted-foreground transition-transform group-open:rotate-90">
                            ›
                          </span>
                        )}
                      </summary>
                      <div className="ml-2 flex flex-col gap-0.5 border-l border-border pl-3">
                        <Link
                          href={`/categories/${category.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                        >
                          Tout voir
                        </Link>
                        {category.subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/categories/${category.slug}?subcategoryId=${sub.id}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>

                {/* Auth section */}
                <div className="border-t border-border pt-4">
                  {isLoading ? (
                    <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
                  ) : user ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 px-2 pb-2">
                        <UserAvatar avatarUrl={user.avatarUrl} size={24} />
                        <p className="truncate text-sm font-medium text-foreground">
                          {user.name}
                        </p>
                      </div>
                      <NotificationsModal
                        unreadCount={unreadCount}
                        onUnreadCountChange={setUnreadCount}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-foreground hover:bg-muted"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          openCart();
                        }}
                        className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-foreground hover:bg-muted"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Panier
                        {totalItemCount > 0 && (
                          <span className="ml-auto rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                            {totalItemCount}
                          </span>
                        )}
                      </button>
                      <Link
                        href="/orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <Package className="h-4 w-4" />
                        Mes commandes
                      </Link>
                      <Link
                        href="/account/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <UserIcon className="h-4 w-4" />
                        Profil
                      </Link>
                      <Link
                        href="/account/favorites"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <Heart className="h-4 w-4" />
                        Favoris
                      </Link>
                      <Link
                        href="/account/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <Settings className="h-4 w-4" />
                        Paramètres
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
                      </button>
                    </div>
                  ) : (
                    <Button
                      render={<Link href="/auth/sign-in" />}
                      nativeButton={false}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full"
                    >
                      Connexion
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
