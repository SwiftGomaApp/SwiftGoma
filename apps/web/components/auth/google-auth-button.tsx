"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { loadGoogleIdentity } from "@/lib/auth/google-identity";
import { toast } from "../ui/toast";
import { GoogleIcon } from "@/lib/constants/auth";
import { Locale } from "@/lib/language";

export function GoogleAuthButton({
  onCredential,
  disabled,
  label = "Google",
  locale = "en",
}: {
  onCredential: (idToken: string) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  locale?: Locale;
}) {
  const hiddenButtonRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const initializedRef = useRef(false);

  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error(
        "[google-auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set — Google sign-in will not work.",
      );
      return;
    }

    let cancelled = false;
    loadGoogleIdentity(locale)
      .then(() => {
        if (cancelled || !hiddenButtonRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            void onCredentialRef.current(response.credential);
          },
        });
        hiddenButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(hiddenButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          locale,
        });
        setReady(true);
      })
      .catch(() => {
        toast.add({
          title: "Google Auth Error",
          description: "Impossible de charger la connexion Google.",
          type: "error",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  function handleClick() {
    const realButton =
      hiddenButtonRef.current?.querySelector('div[role="button"]');
    if (realButton instanceof HTMLElement) {
      realButton.click();
    }
  }

  return (
    <>
      <div ref={hiddenButtonRef} className="hidden" />
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={disabled || !ready}
        onClick={handleClick}
      >
        <GoogleIcon />
        {label}
      </Button>
    </>
  );
}
