import Link from "next/link";
import { FolderX } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Not found",
    description: "This category or subcategory doesn't exist.",
    browse: "Browse categories",
  },
  fr: {
    title: "Introuvable",
    description: "Cette catégorie ou sous-catégorie n'existe pas.",
    browse: "Parcourir les catégories",
  },
} as const;

export default async function CategoryNotFound() {
  const locale = await getServerLocale();
  const t = STRINGS[locale];

  return (
    <main className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderX />
          </EmptyMedia>
          <EmptyTitle>{t.title}</EmptyTitle>
          <EmptyDescription>{t.description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/categories" />}
          >
            {t.browse}
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
