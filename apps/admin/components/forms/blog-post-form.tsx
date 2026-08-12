"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  RichTextEditor,
  isRichTextEmpty,
} from "@/components/forms/rich-text-editor";
import {
  createPost,
  updatePost,
  type BlogPost,
  type BlogPostStatus,
} from "@/lib/api/routes/blog";
import { getErrorMessage } from "@/lib/get-error-message";
import { showSuccessToast } from "@/lib/admin-toast";
import { ui } from "@/lib/i18n/common";
import { cn } from "@/lib/utils";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_MB = 5;

function validateCoverFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Utilisez une image JPEG, PNG ou WEBP.";
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `L'image doit faire ${MAX_IMAGE_SIZE_MB} Mo ou moins.`;
  }
  return null;
}

export function BlogPostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [published, setPublished] = useState(post?.status === "PUBLISHED");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    post?.coverImageUrl ?? null,
  );
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewSource = useMemo(() => {
    if (removeCoverImage) return null;
    if (coverFile) return coverPreview;
    return post?.coverImageUrl ?? null;
  }, [coverFile, coverPreview, post?.coverImageUrl, removeCoverImage]);

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  function handleCoverSelect(file: File | null) {
    if (!file) return;

    const validationError = validateCoverFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setRemoveCoverImage(false);
    setCoverFile(file);

    if (coverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverPreview(URL.createObjectURL(file));
  }

  function handleRemoveCover() {
    setCoverFile(null);
    setRemoveCoverImage(true);

    if (coverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (isRichTextEmpty(content)) {
      setError("Veuillez ajouter du contenu à l'article.");
      setIsSubmitting(false);
      return;
    }

    const status: BlogPostStatus = published ? "PUBLISHED" : "DRAFT";
    const payload = {
      title,
      excerpt,
      content,
      status,
      coverImage: coverFile,
      removeCoverImage,
    };

    try {
      if (post) {
        await updatePost(post.id, payload);
        showSuccessToast("Article mis à jour", title);
      } else {
        await createPost(payload);
        showSuccessToast("Article créé", title);
      }
      router.push("/blog");
    } catch (err) {
      setError(getErrorMessage(err, "Impossible d'enregistrer cet article."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="title">Titre</FieldLabel>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="excerpt">Extrait</FieldLabel>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            required
          />
        </Field>

        <Field>
          <FieldLabel>Image de couverture</FieldLabel>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => handleCoverSelect(e.target.files?.[0] ?? null)}
          />

          {previewSource ? (
            <div className="relative overflow-hidden rounded-xl border">
              <div className="relative aspect-video w-full bg-muted">
                <Image
                  src={previewSource}
                  alt="Aperçu de la couverture"
                  fill
                  className="object-cover"
                  unoptimized={previewSource.startsWith("blob:")}
                />
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Remplacer
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  onClick={handleRemoveCover}
                  aria-label="Supprimer l'image de couverture"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "hover:border-primary/50 hover:bg-muted/40 flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 transition-colors",
              )}
            >
              <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                <ImagePlus className="text-muted-foreground size-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Téléverser une image de couverture</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  JPEG, PNG ou WEBP jusqu'à {MAX_IMAGE_SIZE_MB} Mo
                </p>
              </div>
            </button>
          )}

          <FieldDescription>
            Affichée en haut de l'article sur le blog public.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="content">Contenu</FieldLabel>
          <RichTextEditor
            id="content"
            value={content}
            onChange={setContent}
            placeholder="Rédigez le corps de l'article…"
          />
          <FieldDescription>
            Éditeur de texte enrichi — la mise en forme est conservée sur le blog public.
          </FieldDescription>
        </Field>

        <Field>
          <div className="flex items-center gap-2">
            <Switch
              id="published"
              checked={published}
              onCheckedChange={setPublished}
            />
            <FieldLabel htmlFor="published" className="mb-0">
              Publié
            </FieldLabel>
          </div>
        </Field>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Enregistrement…"
              : post
                ? "Enregistrer les modifications"
                : "Créer l'article"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/blog")}
          >
            {ui.cancel}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
