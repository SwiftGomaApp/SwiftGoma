"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  productName,
}: {
  images: { id: string; url: string }[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-foreground">
        {active && (
          <Image
            src={active.url}
            alt={productName}
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg bg-foreground ring-1 ring-border transition-all",
                index === activeIndex && "ring-2 ring-primary",
              )}
            >
              <Image
                src={image.url}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductGallery;
