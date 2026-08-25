import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import axios from "axios";
import { MapPin } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductPurchasePanel } from "@/components/products/product-purchase-panel";
import { ProductReviews } from "@/components/products/product-reviews";
import { getPublicProductBySlug } from "@/lib/api/routes/products";
import { formatWeight } from "@/lib/products";
import { getServerLocale } from "@/lib/language";

type Props = {
  params: Promise<{ slug: string }>;
};

const STRINGS = {
  en: {
    home: "Home",
    products: "Products",
    description: "Description",
    specifications: "Specifications",
    unit: "Unit",
    weight: "Weight",
    expiresAt: "Best before",
    soldBy: "Sold by",
    unknownCity: "Location not specified",
  },
  fr: {
    home: "Accueil",
    products: "Produits",
    description: "Description",
    specifications: "Caractéristiques",
    unit: "Unité",
    weight: "Poids",
    expiresAt: "À consommer avant",
    soldBy: "Vendu par",
    unknownCity: "Localisation non précisée",
  },
} as const;

async function loadProduct(slug: string) {
  try {
    return await getPublicProductBySlug(slug);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      notFound();
    }
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getPublicProductBySlug(slug);
    return {
      title: `${product.name} | Swiftgoma`,
      description: product.description.slice(0, 160),
    };
  } catch {
    return { title: "Product | Swiftgoma" };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getServerLocale();
  const t = STRINGS[locale];

  const product = await loadProduct(slug);

  const category = product.subcategory?.category;
  const city = product.shop.sellerProfile?.city;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>{t.home}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/products" />}>
              {t.products}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {category && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link href={`/products?categoryId=${category.id}`} />}
                >
                  {category.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          {product.subcategory && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={
                    <Link
                      href={`/products?subcategoryId=${product.subcategory.id}`}
                    />
                  }
                >
                  {product.subcategory.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            {product.brand && (
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {product.brand}
              </p>
            )}
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {product.name}
            </h1>
          </div>

          <ProductPurchasePanel product={product} locale={locale} />

          <div className="border-t border-border pt-6">
            <h2 className="text-sm font-medium text-foreground">
              {t.description}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="text-sm font-medium text-foreground">
              {t.specifications}
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{t.unit}</dt>
              <dd className="text-foreground">{product.unit}</dd>
              {product.weightGrams != null && (
                <>
                  <dt className="text-muted-foreground">{t.weight}</dt>
                  <dd className="text-foreground">
                    {formatWeight(product.weightGrams)}
                  </dd>
                </>
              )}
              {product.expiresAt && (
                <>
                  <dt className="text-muted-foreground">{t.expiresAt}</dt>
                  <dd className="text-foreground">
                    {new Date(product.expiresAt).toLocaleDateString(
                      locale === "fr" ? "fr-FR" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" },
                    )}
                  </dd>
                </>
              )}
            </dl>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border p-4">
            <Avatar size="lg">
              {product.shop.logoUrl && (
                <AvatarImage
                  src={product.shop.logoUrl}
                  alt={product.shop.name}
                />
              )}
              <AvatarFallback>
                {product.shop.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">{t.soldBy}</span>
              <span className="text-sm font-medium text-foreground">
                {product.shop.name}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {city ?? t.unknownCity}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 border-t border-border pt-10">
        <ProductReviews
          productId={product.id}
          rating={product.rating}
          reviews={product.reviews}
          locale={locale}
        />
      </div>
    </main>
  );
}
