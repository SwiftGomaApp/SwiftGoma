"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

type ShareButtonProps = {
  title: string;
  url: string;
};

export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Partager"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
    >
      {copied ? (
        <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Share2 className="h-5 w-5 text-muted-foreground" />
      )}
    </button>
  );
}
