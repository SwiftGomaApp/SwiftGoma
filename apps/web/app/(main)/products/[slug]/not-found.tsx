import Link from "next/link";
import { PackageX } from "lucide-react";

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
    title: "Product not found",
    description:
      "This product may have been removed or is no longer available.",
    browse: "Browse products",
  },
  fr: {
    title: "Produit introuvable",
    description: "Ce produit a peut-être été retiré ou n'est plus disponible.",
    browse: "Parcourir les produits",
  },
} as const;

export default async function ProductNotFound() {
  const locale = await getServerLocale();
  const t = STRINGS[locale];

  return (
    <main className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageX />
          </EmptyMedia>
          <EmptyTitle>{t.title}</EmptyTitle>
          <EmptyDescription>{t.description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/products" />}
          >
            {t.browse}
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
