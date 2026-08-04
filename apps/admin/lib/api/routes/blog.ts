import { apiClient } from "@/lib/api/client";
import { unwrap, toQueryString, type Paginated } from "@/lib/api/utils";

export type BlogPostStatus = "DRAFT" | "PUBLISHED";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  status: BlogPostStatus;
  publishedAt: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostListResponse extends Paginated {
  posts: BlogPost[];
}

export interface BlogPostInput {
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string;
  status: BlogPostStatus;
}

export async function listAdminPosts(params: {
  page?: number;
  limit?: number;
} = {}): Promise<BlogPostListResponse> {
  const res = await apiClient.get(
    `/blog/admin${toQueryString(params)}`,
  );
  return unwrap(res);
}

export async function getPost(id: string): Promise<BlogPost> {
  const res = await apiClient.get(`/blog/admin/${id}`);
  return unwrap(res);
}

export async function createPost(input: BlogPostInput): Promise<BlogPost> {
  const res = await apiClient.post("/blog", input);
  return unwrap(res);
}

export async function updatePost(
  id: string,
  input: Partial<BlogPostInput>,
): Promise<BlogPost> {
  const res = await apiClient.put(`/blog/${id}`, input);
  return unwrap(res);
}

export async function deletePost(id: string): Promise<{ id: string; deleted: boolean }> {
  const res = await apiClient.delete(`/blog/${id}`);
  return unwrap(res);
}
