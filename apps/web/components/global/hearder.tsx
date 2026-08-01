"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ShoppingCart,
  User as UserIcon,
  Settings,
  SlidersHorizontal,
  LogOut,
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
import Logo from "./logo";

import { useEffect } from "react";
import { Kbd } from "@/components/ui/kbd";

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
  isAuthenticated?: boolean;
};

function categoryDescription(subcategories: Subcategory[]) {
  if (subcategories.length === 0) return undefined;
  const names = subcategories.map((s) => s.name);
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} et plus`;
}

export function Header({ categories, isAuthenticated = false }: HeaderProps) {
  const notificationCount = 3;
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 py-4">
        <Logo size={18} />

        {/* Nav — centered, shadcn NavigationMenu. Only "Catégories" has a dropdown. */}
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

        <div className="flex items-center justify-end gap-2">
          {/* Filters */}
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

          {isAuthenticated ? (
            /* User dropdown */
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
                <UserIcon className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {notificationCount}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/notifications" />}>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                    {notificationCount > 0 && (
                      <span className="ml-auto rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                        {notificationCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/cart" />}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Panier
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/account" />}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/account/settings" />}>
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Not logged in */
            <Button
              render={<Link href="/auth/sign-in" />}
              nativeButton={false}
              size="sm"
            >
              Connexion
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
