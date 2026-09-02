import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  CreditCard,
  Navigation,
  Search,
  ShoppingCart,
  Sparkles,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { HomeHeroSearch } from "@/components/home/hero-search";
import { AboutTeaser } from "@/components/home/about-teaser";
import { Testimonials } from "@/components/home/testimonials";
import { FaqTeaser } from "@/components/home/faq-teaser";
import { AppCta } from "@/components/home/app-cta";
import { ShopGrid } from "@/components/shops/shop-grid";
import { ProductCarousel } from "@/components/products/product-carousel";
import { getPublicShops, type PublicShop } from "@/lib/api/routes/shops";
import {
  getPublicCategories,
  getPublicProducts,
  type PublicCategory,
  type PublicProduct,
} from "@/lib/api/routes/products";
import { getCategoryIcon } from "@/lib/category-icons";
import { getServerLocale } from "@/lib/language";
import { HeroCarouselBackground } from "@/components/home/hero-carousel-background";

export const metadata: Metadata = {
  title: "Swiftgoma | Local shopping in Goma, delivered.",
  description:
    "Discover shops and products near you in Goma browse categories, trending products, and local sellers, all in one marketplace.",
};

const STRINGS = {
  en: {
    eyebrow: "SwiftGoma Marketplace",
    title: "Local shopping in Goma, delivered.",
    description:
      "Browse shops and products from sellers across Goma  order online and get it delivered or pick it up yourself.",
    searchPlaceholder: "Search for products…",
    searchButton: "Search",
    browseShops: "Browse shops",
    browseProducts: "Browse products",
    howItWorksTitle: "How it works",
    howItWorksDescription: "From browsing to your doorstep, in four steps.",
    step1Title: "Browse shops & products",
    step1Description:
      "Explore local sellers across Goma and find what you need.",
    step2Title: "Add to your cart",
    step2Description: "Pick your items and quantities from any shop.",
    step3Title: "Checkout your way",
    step3Description:
      "Pay online or cash on delivery, then choose delivery or pickup.",
    step4Title: "Track it in real time",
    step4Description:
      "Follow your order status and your rider's location live.",
    categoriesTitle: "Shop by category",
    categoriesDescription: "Find products organized the way you shop.",
    trendingTitle: "Trending products",
    trendingDescription: "Popular picks from sellers across the marketplace.",
    viewAllProductsCta: "View all products",
    shopsTitle: "Featured shops",
    shopsDescription: "Discover local sellers you can order from right now.",
    viewAll: "View all",
    productsLabel: "products",
    deliveryLabel: "Delivery",
  },
  fr: {
    eyebrow: "Marché SwiftGoma",
    title: "Le shopping local à Goma, livré chez vous.",
    description:
      "Parcourez les boutiques et produits des vendeurs de Goma commandez en ligne et faites-vous livrer ou récupérez sur place.",
    searchPlaceholder: "Rechercher des produits…",
    searchButton: "Rechercher",
    browseShops: "Parcourir les boutiques",
    browseProducts: "Parcourir les produits",
    howItWorksTitle: "Comment ça marche",
    howItWorksDescription: "De la recherche à votre porte, en quatre étapes.",
    step1Title: "Parcourez boutiques & produits",
    step1Description:
      "Explorez les vendeurs locaux de Goma et trouvez ce qu'il vous faut.",
    step2Title: "Ajoutez au panier",
    step2Description:
      "Choisissez vos articles et quantités dans n'importe quelle boutique.",
    step3Title: "Payez à votre façon",
    step3Description:
      "Payez en ligne ou à la livraison, puis choisissez livraison ou retrait.",
    step4Title: "Suivez en temps réel",
    step4Description:
      "Suivez le statut de votre commande et la position de votre livreur en direct.",
    categoriesTitle: "Achetez par catégorie",
    categoriesDescription: "Trouvez des produits organisés selon vos besoins.",
    trendingTitle: "Produits tendance",
    trendingDescription: "Les choix populaires des vendeurs de tout le marché.",
    viewAllProductsCta: "Voir tous les produits",
    shopsTitle: "Boutiques en vedette",
    shopsDescription:
      "Découvrez des vendeurs locaux chez qui commander dès maintenant.",
    viewAll: "Voir tout",
    productsLabel: "produits",
    deliveryLabel: "Livraison",
  },
} as const;

export default async function Home() {
  const locale = await getServerLocale();
  const t = STRINGS[locale];

  const [shopsResult, productsResult, categories] = await Promise.all([
    getPublicShops({ limit: 6 }).catch((): { shops: PublicShop[] } => ({
      shops: [],
    })),
    getPublicProducts({ limit: 8, sortBy: "popular" }).catch(
      (): { products: PublicProduct[] } => ({ products: [] }),
    ),
    getPublicCategories().catch((): PublicCategory[] => []),
  ]);

  const shops = shopsResult.shops;
  const products = productsResult.products;
  const topCategories = categories.slice(0, 8);

  return (
    <main>
      <section className="relative overflow-hidden border-b">
        {/* Background */}
        <HeroCarouselBackground
          images={[
            "https://res.cloudinary.com/dx3wclabo/image/upload/v1788092791/107026_pf1xkl.jpg",
            "https://res.cloudinary.com/dx3wclabo/image/upload/v1788092791/107026_pf1xkl.jpg",
            "https://res.cloudinary.com/dx3wclabo/image/upload/v1788093341/2149095900_owqdq3.jpg",
            "https://res.cloudinary.com/dx3wclabo/image/upload/v1788093660/Goma-Town-750x450_bf04no.jpg",
          ]}
          intervalMs={3000}
        />
        {/* Content */}
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <p className="text-sm font-medium text-primary">{t.eyebrow}</p>

          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {t.title}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
            {t.description}
          </p>

          <HomeHeroSearch
            placeholder={t.searchPlaceholder}
            buttonLabel={t.searchButton}
          />

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button>
              <Link href="/shops">{t.browseShops}</Link>
            </Button>

            <Button
              variant="outline"
              className="border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white"
            >
              <Link href="/products">{t.browseProducts}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {t.howItWorksTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.howItWorksDescription}
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Search,
              title: t.step1Title,
              description: t.step1Description,
            },
            {
              icon: ShoppingCart,
              title: t.step2Title,
              description: t.step2Description,
            },
            {
              icon: CreditCard,
              title: t.step3Title,
              description: t.step3Description,
            },
            {
              icon: Navigation,
              title: t.step4Title,
              description: t.step4Description,
            },
          ].map(({ icon: Icon, title, description }, index) => (
            <div
              key={title}
              className="relative rounded-2xl border border-border bg-card p-5"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <Icon className="mt-4 size-5 text-primary" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {topCategories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {t.categoriesTitle}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.categoriesDescription}
              </p>
            </div>
            <Link
              href="/categories"
              className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t.viewAll}
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {topCategories.map((category) => {
              const Icon = getCategoryIcon(category.slug);
              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-colors hover:border-primary/40"
                >
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <span className="line-clamp-2 text-xs font-medium text-foreground">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="border-t bg-muted/10">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {t.trendingTitle}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.trendingDescription}
            </p>
            <div className="mt-8">
              <ProductCarousel
                products={products}
                viewAllHref="/products"
                viewAllLabel={t.viewAll}
                ctaLabel={t.viewAllProductsCta}
              />
            </div>
          </div>
        </section>
      )}

      {shops.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Store className="size-5 text-primary" aria-hidden="true" />
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {t.shopsTitle}
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.shopsDescription}
              </p>
            </div>
            <Link
              href="/shops"
              className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t.viewAll}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8">
            <ShopGrid
              shops={shops}
              productsLabel={t.productsLabel}
              deliveryLabel={t.deliveryLabel}
            />
          </div>
        </section>
      )}

      <AboutTeaser locale={locale} />
      <Testimonials locale={locale} />
      <FaqTeaser locale={locale} />
      <AppCta locale={locale} />
    </main>
  );
}
