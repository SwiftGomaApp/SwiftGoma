"use client";

import { useState } from "react";
import { RatingStars } from "./rating-stars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type Review = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ProductReviewsProps = {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
  onSubmit: (rating: number, comment: string) => Promise<void>;
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProductReviews({
  reviews,
  averageRating,
  totalCount,
  onSubmit,
}: ProductReviewsProps) {
  const [isWriting, setIsWriting] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formRating === 0 || !formComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formRating, formComment.trim());
      setIsWriting(false);
      setFormRating(0);
      setFormComment("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id="reviews"
      className="flex flex-col gap-6 border-t border-border pt-10 scroll-mt-20"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Avis clients
          </h2>
          <div className="flex items-center gap-1.5">
            <RatingStars rating={averageRating} size="md" />
            <span className="text-sm text-muted-foreground">
              {averageRating.toFixed(1)} ({totalCount} avis)
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsWriting((v) => !v)}
        >
          {isWriting ? "Annuler" : "Laisser un avis"}
        </Button>
      </div>

      {isWriting && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-lg border border-border p-4"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Votre note
            </span>
            <RatingStars rating={formRating} size="md" onRate={setFormRating} />
          </div>
          <Textarea
            value={formComment}
            onChange={(e) => setFormComment(e.target.value)}
            placeholder="Partagez votre expérience avec ce produit..."
            rows={3}
            required
          />
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || formRating === 0 || !formComment.trim()}
            className="self-start"
          >
            {isSubmitting ? "Envoi..." : "Publier l'avis"}
          </Button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun avis pour le moment. Soyez le premier à donner votre avis.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                {initials(review.authorName)}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {review.authorName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <RatingStars rating={review.rating} />
                <p className="text-sm text-muted-foreground">
                  {review.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
