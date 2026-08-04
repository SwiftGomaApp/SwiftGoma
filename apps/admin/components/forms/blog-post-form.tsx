"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  createPost,
  updatePost,
  type BlogPost,
  type BlogPostStatus,
} from "@/lib/api/routes/blog";
import { ApiError } from "@/lib/api/client";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export function BlogPostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [published, setPublished] = useState(post?.status === "PUBLISHED");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const status: BlogPostStatus = published ? "PUBLISHED" : "DRAFT";

    try {
      if (post) {
        await updatePost(post.id, { title, excerpt, content, coverImageUrl, status });
      } else {
        await createPost({ title, excerpt, content, coverImageUrl, status });
      }
      router.push("/blog");
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't save this post."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="excerpt">Excerpt</FieldLabel>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="coverImageUrl">Cover image URL</FieldLabel>
          <Input
            id="coverImageUrl"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://..."
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="content">Content (Markdown)</FieldLabel>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="font-mono text-sm"
            required
          />
        </Field>

        <Field>
          <div className="flex items-center gap-2">
            <Switch checked={published} onCheckedChange={setPublished} />
            <FieldLabel htmlFor="published" className="mb-0">
              Published
            </FieldLabel>
          </div>
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : post ? "Save changes" : "Create post"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/blog")}
          >
            Cancel
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
