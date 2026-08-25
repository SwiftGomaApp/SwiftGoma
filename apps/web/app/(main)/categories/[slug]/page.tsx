import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicCategories } from "@/lib/api/routes/products";
import { getCategoryIcon } from "@/lib/category-icons";
import { getServerLocale } from "@/lib/language";

type Props = {
  params: Promise<{ slug: string }>;
};

const STRINGS = {
  en: {
    home: "Home",
    categories: "Categories",
    subtitle: (n: number) => (n === 1 ? "1 subcategory" : `${n} subcategories`),
    shopAll: "Shop all in this category",
    empty: "No subcategories yet — check back soon.",
  },
  fr: {
    home: "Accueil",
    categories: "Catégories",
    subtitle: (n: number) =>
      n === 1 ? "1 sous-catégorie" : `${n} sous-catégories`,
    shopAll: "Voir tout dans cette catégorie",
    empty: "Aucune sous-catégorie pour le moment — revenez bientôt.",
  },
} as const;

async function loadCategory(slug: string) {
  const categories = await getPublicCategories();
  return categories.find((category) => category.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await loadCategory(slug).catch(() => undefined);
  if (!category) return { title: "Category | Swiftgoma" };
  return {
    title: `${category.name} | Swiftgoma`,
    description: `Browse ${category.name} products on Swiftgoma.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getServerLocale();
  const t = STRINGS[locale];

  const category = await loadCategory(slug);
  if (!category) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>
              {t.home}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/categories" />}>
              {t.categories}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {category.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.subtitle(category.subcategories.length)}
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/products?categoryId=${category.id}`} />}
        >
          {t.shopAll}
        </Button>
      </div>

      {category.subcategories.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {category.subcategories.map((subcategory) => {
            const Icon = getCategoryIcon(subcategory.slug);
            return (
              <Link
                key={subcategory.id}
                href={`/categories/${category.slug}/${subcategory.slug}`}
              >
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-col items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {subcategory.name}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
