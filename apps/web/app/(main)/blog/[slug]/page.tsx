import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Store } from "lucide-react";

import { getPublicBlogPost, type PublicBlogPost } from "@/lib/api/routes/blog";
import { sanitizeBlogHtml } from "@/lib/blog";
import { BLOG_POST_TEMPLATES } from "@/lib/constants/blog";
import { getServerLocale } from "@/lib/language";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

function fallbackPost(
  slug: string,
  locale: "en" | "fr",
): PublicBlogPost | undefined {
  const post = BLOG_POST_TEMPLATES.find((item) => item.slug === slug);
  if (!post) return undefined;

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const post = await getPublicBlogPost(slug).catch(() =>
    fallbackPost(slug, "en"),
  );

  if (!post) {
    return {
      title: "Article not found | Swiftgoma",
    };
  }

  return {
    title: `${post.title} | Swiftgoma`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [
        {
          url: post.coverImageUrl ?? "",
        },
      ],
    },
  };
}

function formatDate(date: string, locale: "en" | "fr") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getServerLocale();

  const post = await getPublicBlogPost(slug).catch(() =>
    fallbackPost(slug, locale),
  );

  if (!post) {
    notFound();
  }

  return (
    <main>
      {/* Header */}
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 size-4" />

            {locale === "fr" ? "Retour au blog" : "Back to blog"}
          </Link>

          <div className="mt-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />

              {post.publishedAt && formatDate(post.publishedAt, locale)}
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              {post.title}
            </h1>

            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              {post.excerpt}
            </p>
          </div>
        </div>
      </section>

      {/* Cover */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          {post.coverImageUrl && (
            <div className="relative aspect-16/8 overflow-hidden rounded-3xl">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1200px"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* Rich text content */}
      <article className="mx-auto max-w-3xl overflow-x-hidden px-4 pb-20 sm:px-6 lg:px-8">
        <div
          className="
            prose
            prose-neutral
            dark:prose-invert
            max-w-none
            wrap-break-word

            prose-headings:font-semibold
            prose-headings:tracking-tight
            prose-headings:text-foreground
            prose-strong:text-foreground

            prose-h2:mt-12
            prose-h2:text-2xl
            prose-h3:text-xl

            prose-p:leading-8
            prose-p:text-muted-foreground
            prose-li:text-muted-foreground
            prose-li:marker:text-primary

            prose-a:text-primary
            prose-a:underline
            prose-a:underline-offset-4
            hover:prose-a:text-primary/80

            prose-blockquote:border-l-orange-500
            prose-blockquote:text-foreground
            prose-blockquote:not-italic
            prose-blockquote:bg-muted/50
            prose-blockquote:py-1

            prose-img:rounded-2xl
          "
          dangerouslySetInnerHTML={{
            __html: sanitizeBlogHtml(post.content),
          }}
        />
      </article>

      {/* Bottom CTA */}
      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-3xl border bg-card px-6 py-12 sm:px-12 sm:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 -z-10 size-64 rounded-full bg-primary/10 blur-3xl"
            />
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Store className="size-6" aria-hidden="true" />
              </div>
              <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                Swiftgoma
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {locale === "fr"
                  ? "Prêt à découvrir ce que Goma a à offrir ?"
                  : "Ready to discover what Goma has to offer?"}
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                {locale === "fr"
                  ? "Parcourez les boutiques locales, trouvez ce dont vous avez besoin et commandez simplement."
                  : "Browse local shops, find what you need, and order with confidence."}
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  nativeButton={false}
                  render={<Link href="/shops" />}
                  className="h-11 px-5"
                >
                  {locale === "fr" ? "Explorer les boutiques" : "Explore shops"}
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/blog" />}
                  className="h-11 px-5"
                >
                  {locale === "fr"
                    ? "Lire plus d'articles"
                    : "Read more articles"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
