"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { loadGoogleIdentity } from "@/lib/google-identity";
import { getGoogleClientId } from "@/lib/google-auth-config";
import { showErrorToast } from "@/lib/admin-toast";

const GOOGLE_NOT_CONFIGURED_MESSAGE =
  "La connexion Google n'est pas configurée pour cette application admin. Définissez NEXT_PUBLIC_GOOGLE_CLIENT_ID dans apps/admin/.env.local (même valeur que l'application web).";

function GoogleLogo() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.59-5.17 3.59-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.1C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  onCredential,
  disabled,
  label = "Continuer avec Google",
  className,
}: {
  onCredential: (idToken: string) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  const hiddenButtonRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const clientId = getGoogleClientId();
  const isConfigured = Boolean(clientId);

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;
    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !hiddenButtonRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            void onCredential(response.credential);
          },
        });
        window.google.accounts.id.renderButton(hiddenButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
        });
        setReady(true);
      })
      .catch(() => {
        showErrorToast(
          "Connexion Google indisponible",
          "Impossible de charger Google Identity Services.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential]);

  function handleClick() {
    if (!isConfigured) return;

    const realButton = hiddenButtonRef.current?.querySelector(
      'div[role="button"]',
    );
    if (realButton instanceof HTMLElement) {
      realButton.click();
    }
  }

  return (
    <>
      {isConfigured && <div ref={hiddenButtonRef} className="hidden" />}
      <Button
        type="button"
        variant="outline"
        className={className ?? "w-full gap-2"}
        disabled={disabled || !isConfigured || !ready}
        title={!isConfigured ? GOOGLE_NOT_CONFIGURED_MESSAGE : undefined}
        onClick={handleClick}
      >
        <GoogleLogo />
        <span className="text-xs">
          {!isConfigured ? "Google (non configuré)" : label}
        </span>
      </Button>
    </>
  );
}
