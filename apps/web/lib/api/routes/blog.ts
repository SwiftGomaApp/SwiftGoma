import "server-only";

import { createServerApiClient } from "@/lib/api/server";

export type PublicBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
};

type BlogListResponse = {
  posts: PublicBlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiEnvelope<T> = { success: boolean; data: T };

/** Fetches only published posts, which are safe to expose on the public site. */
export async function getPublicBlogPosts(limit = 50) {
  const client = await createServerApiClient();
  const { data } = await client.get<ApiEnvelope<BlogListResponse>>("/blog", {
    params: { page: 1, limit },
  });
  return data.data.posts;
}

export async function getPublicBlogPost(slug: string) {
  const client = await createServerApiClient();
  const { data } = await client.get<ApiEnvelope<PublicBlogPost>>(
    `/blog/slug/${encodeURIComponent(slug)}`,
  );
  return data.data;
}
