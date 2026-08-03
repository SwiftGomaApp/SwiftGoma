import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type RatingStarsProps = {
  rating: number;
  size?: "sm" | "md";
};

export function RatingStars({ rating, size = "sm" }: RatingStarsProps) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex items-center" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => {
        const fillPercent = Math.max(0, Math.min(1, rating - i)) * 100;
        return (
          <div key={i} className="relative">
            <Star className={cn(starSize, "text-muted-foreground/30")} />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
            >
              <Star className={cn(starSize, "fill-amber-400 text-amber-400")} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
