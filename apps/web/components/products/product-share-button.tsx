"use client";

import { useEffect, useState } from "react";
import { Check, Link as LinkIcon, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    share: "Share",
    copyLink: "Copy link",
    copied: "Link copied",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    x: "X",
  },
  fr: {
    share: "Partager",
    copyLink: "Copier le lien",
    copied: "Lien copié",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    x: "X",
  },
} as const;

function WhatsAppIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.42a9.87 9.87 0 0 0 4.62 1.18h.01c5.46 0 9.9-4.45 9.9-9.9 0-2.65-1.03-5.13-2.9-7C17.17 3.03 14.69 2 12.04 2zm0 1.67c2.21 0 4.28.86 5.84 2.42a8.21 8.21 0 0 1 2.42 5.82c0 4.55-3.7 8.25-8.26 8.25a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.56 3.7-8.25 8.24-8.25zm-4.3 4.44c-.17 0-.44.06-.67.32-.23.25-.87.85-.87 2.08 0 1.22.9 2.4 1.02 2.57.13.17 1.75 2.8 4.31 3.81.6.24 1.07.38 1.44.49.6.18 1.15.16 1.58.1.48-.08 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.17-.48-.29-.25-.13-1.48-.73-1.71-.82-.23-.08-.4-.13-.56.13-.17.25-.65.82-.8.99-.15.17-.29.19-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.36-.78-1.86-.2-.48-.4-.42-.56-.42z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.9 2H22l-7.6 8.7L23.3 22H16.6l-5.2-6.8L5.4 22H2.3l8.1-9.3L1.5 2h6.9l4.7 6.2L18.9 2zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20z" />
    </svg>
  );
}

export function ProductShareButton({
  productName,
  locale,
}: {
  productName: string;
  locale: Locale;
}) {
  const t = STRINGS[locale];
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && Boolean(navigator.share),
    );
  }, []);

  function getUrl() {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title: productName, url: getUrl() });
    } catch {
      // user cancelled the native share sheet — nothing to do
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      toast.add({ title: t.copied, type: "success" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.add({ title: t.copyLink, type: "error" });
    }
  }

  if (canNativeShare) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label={t.share}
        onClick={handleNativeShare}
        className="shrink-0 border-border"
      >
        <Share2 className="size-5 text-muted-foreground" />
      </Button>
    );
  }

  const shareText = `${productName} ${getUrl()}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label={t.share}
            className="shrink-0 border-border"
          />
        }
      >
        <Share2 className="size-5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="size-4" />
          ) : (
            <LinkIcon className="size-4" />
          )}
          {t.copyLink}
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <WhatsAppIcon />
          {t.whatsapp}
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <FacebookIcon />
          {t.facebook}
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <XIcon />
          {t.x}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProductShareButton;
