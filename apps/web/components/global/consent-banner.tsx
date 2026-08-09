// components/consent-banner.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "swiftgoma-consent";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage on mount
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ accepted: true, date: new Date().toISOString() }),
    );
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ accepted: false, date: new Date().toISOString() }),
    );
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies et conditions d'utilisation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-6 py-5 shadow-lg"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted-foreground">
          En utilisant SwiftGoma, vous acceptez nos{" "}
          <Link
            href="/legal/terms"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Conditions générales d&apos;utilisation
          </Link>{" "}
          et notre{" "}
          <Link
            href="/legal/cookies"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Politique de cookies
          </Link>
          . Consultez également notre{" "}
          <Link
            href="/legal/privacy"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Politique de confidentialité
          </Link>
          .
        </p>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleDecline}>
            Refuser
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
