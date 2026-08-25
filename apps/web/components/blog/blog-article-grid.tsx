"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Search } from "lucide-react";

import type { PublicBlogPost } from "@/lib/api/routes/blog";

type Props = {
  locale: "en" | "fr";
  posts: PublicBlogPost[];
  title: string;
  readArticle: string;
};

function formatDate(date: string, locale: "en" | "fr") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function BlogArticleGrid({ locale, posts, title, readArticle }: Props) {
  const [query, setQuery] = useState("");
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return posts;
    return posts.filter((post) =>
      `${post.title} ${post.excerpt}`.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [posts, query]);

  const searchLabel = locale === "fr" ? "Rechercher un article" : "Search articles";

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {locale === "fr"
              ? "Découvrez les dernières nouvelles et les guides publiés par Swiftgoma."
              : "Explore the latest news and guides published by Swiftgoma."}
          </p>
        </div>
        <div className="relative w-full sm:max-w-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            aria-label={searchLabel}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchLabel}
            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {filteredPosts.length ? (
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, index) => (
            <article key={post.id} className="group overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md">
              <Link href={`/blog/${post.slug}`} className="block h-full">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {post.coverImageUrl ? (
                    <Image
                      src={post.coverImageUrl}
                      alt={post.title}
                      fill
                      priority={index < 3}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : <div className="h-full bg-muted" />}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-primary">Swiftgoma</span>
                    {post.publishedAt && <><span aria-hidden="true">•</span><CalendarDays className="size-3" aria-hidden="true" />{formatDate(post.publishedAt, locale)}</>}
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-lg font-semibold tracking-tight">{post.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">{readArticle}<ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-7 rounded-2xl border border-dashed bg-muted/30 px-6 py-14 text-center">
          <Search className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
          <h3 className="mt-4 font-semibold">{locale === "fr" ? "Aucun article trouvé" : "No articles found"}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{locale === "fr" ? "Essayez avec un autre mot-clé." : "Try a different search term."}</p>
        </div>
      )}
    </section>
  );
}
