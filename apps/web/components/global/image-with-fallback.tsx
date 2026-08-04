"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { Store } from "lucide-react";

type ImageWithFallbackProps = Omit<ImageProps, "onError">;

export function ImageWithFallback({
  src,
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <Store className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image src={src} alt={alt} onError={() => setHasError(true)} {...props} />
  );
}
