import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getPublicCategories } from "@/lib/api/routes/products";
import { getCategoryIcon } from "@/lib/category-icons";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Categories | Swiftgoma",
  description: "Browse all product categories on Swiftgoma.",
};

const STRINGS = {
  en: {
    eyebrow: "Browse",
    title: "Shop by category",
    description: "Find products organized the way you shop.",
    subcategoryCount: (n: number) =>
      n === 1 ? "1 subcategory" : `${n} subcategories`,
    empty: "No categories available yet.",
  },
  fr: {
    eyebrow: "Parcourir",
    title: "Achetez par catégorie",
    description: "Trouvez des produits organisés selon vos besoins.",
    subcategoryCount: (n: number) =>
      n === 1 ? "1 sous-catégorie" : `${n} sous-catégories`,
    empty: "Aucune catégorie disponible pour le moment.",
  },
} as const;

export default async function CategoriesPage() {
  const locale = await getServerLocale();
  const t = STRINGS[locale];
  const categories = await getPublicCategories().catch(() => []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-medium text-primary">{t.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {t.title}
      </h1>
      <p className="mt-3 max-w-xl text-base text-muted-foreground">
        {t.description}
      </p>

      {categories.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.slug);
            return (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-col items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {category.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t.subcategoryCount(category.subcategories.length)}
                        </span>
                      </div>
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
