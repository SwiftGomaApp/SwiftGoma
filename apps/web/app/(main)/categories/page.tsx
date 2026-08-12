import Link from "next/link";
import { Grid3x3 } from "lucide-react";
import type { Metadata } from "next";
import { publicApi } from "@/lib/api/routes/public";
import { CATEGORIES } from "@/lib/mock-categories";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Catégories",
  description:
    "Parcourez toutes les catégories de produits disponibles sur SwiftGoma.",
  path: "/categories",
});

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof publicApi.listCategories>> =
    CATEGORIES;
  try {
    categories = await publicApi.listCategories();
  } catch {
    // fall back to mock categories
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Catégories
        </h1>
        <p className="text-sm text-muted-foreground">
          Parcourez tous les produits par catégorie
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="flex flex-col gap-3 rounded-xl border border-border p-5 transition-colors hover:bg-muted"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <Grid3x3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">
                {category.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {category.subcategories.length} sous-catégorie
                {category.subcategories.length > 1 ? "s" : ""}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
