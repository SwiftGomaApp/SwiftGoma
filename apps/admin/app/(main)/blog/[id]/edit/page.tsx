"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogPostForm } from "@/components/forms/blog-post-form";
import { getPost, type BlogPost } from "@/lib/api/routes/blog";
import { ApiError } from "@/lib/api/client";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function EditBlogPostPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPost(params.id)
      .then(setPost)
      .catch((err) => setError(getErrorMessage(err, "Impossible de charger cet article.")))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Modifier l&apos;article</h1>
      {isLoading ? (
        <Skeleton className="h-96 max-w-2xl" />
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : post ? (
        <BlogPostForm post={post} />
      ) : null}
    </div>
  );
}
