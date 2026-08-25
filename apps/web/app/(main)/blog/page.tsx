import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";

import { BlogArticleGrid } from "@/components/blog/blog-article-grid";
import { Button } from "@/components/ui/button";
import { getPublicBlogPosts, type PublicBlogPost } from "@/lib/api/routes/blog";
import { BLOG_POST_TEMPLATES } from "@/lib/constants/blog";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Blog | Swiftgoma",
  description:
    "Discover stories, insights and updates from Swiftgoma and local commerce in Goma.",
};

const STRINGS = {
  en: {
    eyebrow: "Swiftgoma Blog",
    title: "Insights and Updates",
    description:
      "Discover stories about local commerce, sellers, delivery and the people building a better way to shop in Goma.",
    readArticle: "Read article",
    latest: "All Articles",
    minRead: "min read",
  },
  fr: {
    eyebrow: "Blog Swiftgoma",
    title: "Actualités et idées",
    description:
      "Découvrez des histoires sur le commerce local, les vendeurs, la livraison et les personnes qui construisent une meilleure façon de faire ses achats à Goma.",
    readArticle: "Lire l'article",
    latest: "Tous les articles",
    minRead: "min de lecture",
  },
} as const;

function localizedTemplatePost(post: (typeof BLOG_POST_TEMPLATES)[number], locale: "en" | "fr"): PublicBlogPost {
  return {
    id: post.id,
    title: post.title[locale],
    slug: post.slug,
    excerpt: post.excerpt[locale],
    content: post.content[locale],
    coverImageUrl: post.coverImageUrl,
    publishedAt: post.publishedAt,
  };
}

function BlogHero({
  locale,
  t,
}: {
  locale: "en" | "fr";
  t: {
    eyebrow: string;
    title: string;
    description: string;
  };
}) {
  return (
    <section className="border-b bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-medium text-muted-foreground">{t.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{t.title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          {t.description}
        </p>
        <p className="mt-5 text-xs text-muted-foreground">
          {locale === "fr" ? "Guides pratiques pour le commerce local." : "Practical guides for local commerce."}
        </p>
      </div>
    </section>
  );
}

export default async function BlogPage() {
  const locale = await getServerLocale();
  const t = STRINGS[locale];

  // The admin dashboard is the source of truth. Templates keep the page useful
  // while a development API is not running yet.
  const posts = await getPublicBlogPosts().catch(() =>
    BLOG_POST_TEMPLATES.map((post) => localizedTemplatePost(post, locale)),
  );

  if (!posts.length) {
    return (
      <main>
        <BlogHero locale={locale} t={t} />

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-3xl border bg-card px-6 py-14 text-center shadow-sm sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
            />
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Newspaper className="size-7" aria-hidden="true" />
            </div>
            <p className="mt-6 text-sm font-medium text-primary">
              {locale === "fr" ? "Bientôt disponible" : "Coming soon"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {locale === "fr"
                ? "De nouvelles histoires arrivent bientôt."
                : "New stories are on their way."}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              {locale === "fr"
                ? "Nous préparons des conseils, des actualités et des histoires sur le commerce local à Goma. Revenez bientôt pour découvrir notre premier article."
                : "We’re preparing useful guides, local updates, and stories from Goma’s commerce community. Check back soon for our first article."}
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {locale === "fr" ? "Découvrir les produits" : "Browse products"}
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <BlogHero locale={locale} t={t} />

      <BlogArticleGrid locale={locale} posts={posts} title={t.latest} readArticle={t.readArticle} />

      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-primary">Swiftgoma newsletter</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{locale === "fr" ? "Recevez les actualités locales." : "Get local updates in your inbox."}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{locale === "fr" ? "Des conseils utiles et des nouveautés de la communauté Swiftgoma, sans surcharge." : "Useful guides and news from the Swiftgoma community, without the noise."}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button> {locale === "fr" ? "S'inscrire" : "Subscribe"}</Button><Button variant="outline" nativeButton={false} render={<Link href="/contact" />}>{locale === "fr" ? "Nous contacter" : "Contact us"}</Button></div>
        </div>
      </section>
    </main>
  );
}
