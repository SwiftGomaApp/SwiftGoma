"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { apiPost, isApiError } from "@/lib/api/client";
import { PRODUCT_REVIEW_ROUTES } from "@/lib/api/routes/reviews.routes";
import type { Locale } from "@/lib/language";
import type {
  PublicProductRating,
  PublicProductReview,
} from "@/lib/api/routes/products";

const STRINGS = {
  en: {
    title: "Reviews",
    noReviews: "No reviews yet — be the first to share your experience.",
    reviewsCount: (n: number) => (n === 1 ? "1 review" : `${n} reviews`),
    writeReview: "Write a review",
    ratingLabel: "Your rating",
    commentLabel: "Your review",
    commentPlaceholder:
      "Share details about your experience with this product…",
    submit: "Submit review",
    submitting: "Submitting…",
    genericError: "Something went wrong. Please try again.",
    signInLink: "Sign in",
    thanks: "Thanks — your review has been posted.",
  },
  fr: {
    title: "Avis",
    noReviews:
      "Aucun avis pour le moment — soyez le premier à partager votre expérience.",
    reviewsCount: (n: number) => (n === 1 ? "1 avis" : `${n} avis`),
    writeReview: "Rédiger un avis",
    ratingLabel: "Votre note",
    commentLabel: "Votre avis",
    commentPlaceholder: "Partagez votre expérience avec ce produit…",
    submit: "Publier l'avis",
    submitting: "Envoi…",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    signInLink: "Se connecter",
    thanks: "Merci — votre avis a été publié.",
  },
} as const;

export function RatingStars({
  value,
  size = 16,
}: {
  value: number;
  size?: number;
}) {
  const rounded = Math.round(value);
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={cn(
            i < rounded
              ? "fill-primary text-primary"
              : "fill-none text-muted-foreground",
          )}
        />
      ))}
    </div>
  );
}

function ReviewForm({
  productId,
  locale,
  onSubmitted,
}: {
  productId: string;
  locale: Locale;
  onSubmitted: (review: PublicProductReview) => void;
}) {
  const t = STRINGS[locale];
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || !comment.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await apiPost(PRODUCT_REVIEW_ROUTES.submit(productId), {
        rating,
        comment: comment.trim(),
      });

      onSubmitted({
        id: `local-${Date.now()}`,
        authorName: user?.name ?? "",
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      if (isApiError(err) && err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else {
        setError(t.genericError);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border p-4"
    >
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel>{t.ratingLabel}</FieldLabel>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const starValue = i + 1;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`${starValue}`}
                  onClick={() => setRating(starValue)}
                  disabled={loading}
                >
                  <Star
                    className={cn(
                      "size-6 transition-colors",
                      starValue <= rating
                        ? "fill-primary text-primary"
                        : "fill-none text-muted-foreground",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="review-comment">{t.commentLabel}</FieldLabel>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.commentPlaceholder}
            required
            disabled={loading}
            className="min-h-28 resize-y"
          />
        </Field>

        {error && (
          <FieldDescription className="text-destructive">
            {error}
          </FieldDescription>
        )}

        <Button
          type="submit"
          disabled={loading || !comment.trim()}
          className="w-fit"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? t.submitting : t.submit}
        </Button>
      </FieldGroup>
    </form>
  );
}

export function ProductReviews({
  productId,
  rating,
  reviews,
  locale,
}: {
  productId: string;
  rating: PublicProductRating;
  reviews: PublicProductReview[];
  locale: Locale;
}) {
  const t = STRINGS[locale];
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState(reviews);
  const [showForm, setShowForm] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">{t.title}</h2>
          {rating.count > 0 && (
            <div className="flex items-center gap-2">
              <RatingStars value={rating.average} />
              <span className="text-sm text-muted-foreground">
                {rating.average.toFixed(1)} · {t.reviewsCount(rating.count)}
              </span>
            </div>
          )}
        </div>

        {!authLoading &&
          (isAuthenticated ? (
            !showForm &&
            !sent && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(true)}
              >
                {t.writeReview}
              </Button>
            )
          ) : (
            <Button
              type="button"
              variant="outline"
              nativeButton={false}
              render={<Link href="/auth/sign-in" />}
            >
              {t.signInLink}
            </Button>
          ))}
      </div>

      {!authLoading && isAuthenticated && showForm && !sent && (
        <ReviewForm
          productId={productId}
          locale={locale}
          onSubmitted={(review) => {
            setItems((prev) => [review, ...prev]);
            setShowForm(false);
            setSent(true);
          }}
        />
      )}

      {sent && <p className="text-sm text-muted-foreground">{t.thanks}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.noReviews}</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {items.map((review) => (
            <li
              key={review.id}
              className="border-b border-border pb-5 last:border-none"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {review.authorName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString(
                    locale === "fr" ? "fr-FR" : "en-US",
                    { year: "numeric", month: "short", day: "numeric" },
                  )}
                </span>
              </div>
              <RatingStars value={review.rating} size={14} />
              <p className="mt-2 text-sm text-muted-foreground">
                {review.comment}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ProductReviews;
