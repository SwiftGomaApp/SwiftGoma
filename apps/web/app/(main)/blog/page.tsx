import Link from "next/link";
import { Newspaper } from "lucide-react";
import type { Metadata } from "next";
import { blogApi } from "@/lib/api/routes/blog";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog",
  description:
    "Actualités, conseils e-commerce et annonces SwiftGoma pour la marketplace en RDC et au Rwanda.",
  path: "/blog",
});

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default async function BlogPage() {
  let posts: Awaited<ReturnType<typeof blogApi.list>>["posts"] = [];

  try {
    const result = await blogApi.list();
    posts = result.posts;
  } catch (err) {
    console.warn("[BlogPage] Failed to load posts:", (err as Error).message);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Blog
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Actualités, conseils et coulisses de SwiftGoma.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 rounded-lg border border-border py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Newspaper className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Aucun article pour le moment
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Revenez bientôt pour découvrir nos actualités.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:bg-muted/40"
            >
              <div className="relative aspect-video w-full bg-muted">
                {post.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-pasted URL, not a pre-configured next/image remote host
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Newspaper className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <span className="text-xs text-muted-foreground">
                  {post.publishedAt ? formatDate(post.publishedAt) : ""}
                </span>
                <h2 className="font-semibold text-foreground">{post.title}</h2>
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
