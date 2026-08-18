import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { blogApi } from "@/lib/api/routes/blog";
import { ApiException } from "@/lib/api";
import { ServerErrorBanner } from "@/components/global/server-error-banner";
import { buildPageMetadata } from "@/lib/seo";
import { sanitizeHtml } from "@/lib/sanitize-html";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

function isHtmlContent(content: string) {
  return /<[a-z][\s\S]*>/i.test(content.trim());
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await blogApi.getBySlug(slug);
    return buildPageMetadata({
      title: post.title,
      description: post.excerpt,
      path: `/blog/${slug}`,
      openGraph: {
        type: "article",
        publishedTime: post.publishedAt ?? post.createdAt,
        images: post.coverImageUrl
          ? [{ url: post.coverImageUrl, alt: post.title }]
          : undefined,
      },
    });
  } catch {
    return { title: "Article" };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  let post;
  try {
    post = await blogApi.getBySlug(slug);
  } catch (err) {
    if (err instanceof ApiException) {
      if (err.isNetworkError) {
        return (
          <div className="mx-auto max-w-3xl px-6 py-10">
            <ServerErrorBanner />
          </div>
        );
      }
      if (err.statusCode === 404) {
        notFound();
      }
    }
    throw err;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-col gap-4">
        <span className="text-sm text-muted-foreground">
          {post.publishedAt ? formatDate(post.publishedAt) : ""}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {post.title}
        </h1>
      </div>

      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt={post.title}
          className="mt-8 aspect-video w-full rounded-2xl object-cover"
        />
      )}

      <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none">
        {isHtmlContent(post.content) ? (
          <div
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
          />
        ) : (
          <ReactMarkdown>{post.content}</ReactMarkdown>
        )}
      </div>
    </main>
  );
}
