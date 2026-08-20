"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "swiftgoma_cookie_consent";

type CookieConsent = "accepted" | "rejected";

export function CookieConsentModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);

    if (!consent) {
      setVisible(true);
    }
  }, []);

  const saveConsent = (consent: CookieConsent) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, consent);
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto max-w-3xl rounded-xl border bg-background p-5 shadow-lg">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">We use cookies</h2>

          <p className="text-sm text-muted-foreground">
            SwiftGoma uses essential cookies to keep you signed in, secure your
            account, and provide core Platform functionality. We may also use
            optional cookies to improve your experience.
          </p>

          <p className="text-sm text-muted-foreground">
            Learn more in our{" "}
            <Link href="/cookies" className="text-primary underline">
              Cookie Policy
            </Link>
            .
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => saveConsent("rejected")}>
              Reject optional cookies
            </Button>

            <Button onClick={() => saveConsent("accepted")}>Accept all</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
