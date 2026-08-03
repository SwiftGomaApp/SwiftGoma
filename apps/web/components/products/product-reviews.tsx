import { RatingStars } from "./rating-stars";
import { Button } from "@/components/ui/button";

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
}: ProductReviewsProps) {
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
        <Button variant="outline" size="sm">
          Laisser un avis
        </Button>
      </div>

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
