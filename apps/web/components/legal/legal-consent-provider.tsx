"use client";

import { useState } from "react";
import { TermsConsentModal } from "./terms-modal";
import { CookieConsentModal } from "./cookie-modal";

export function LegalConsentProvider() {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <>
      <TermsConsentModal onAccepted={() => setTermsAccepted(true)} />

      {termsAccepted && <CookieConsentModal />}
    </>
  );
}
