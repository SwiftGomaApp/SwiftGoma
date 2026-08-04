import { api } from "../client";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type BlogPostListResponse = {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function unwrap<T>(promise: Promise<{ data: { data: T } }>) {
  return promise.then((res) => res.data.data);
}

export const blogApi = {
  list(params: { page?: number; limit?: number } = {}) {
    return unwrap<BlogPostListResponse>(api.get("/blog", { params }));
  },

  getBySlug(slug: string) {
    return unwrap<BlogPost>(api.get(`/blog/slug/${slug}`));
  },
};
