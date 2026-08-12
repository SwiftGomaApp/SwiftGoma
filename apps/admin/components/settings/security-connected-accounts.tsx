"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link2, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { linkGoogleAccount, unlinkGoogleAccount } from "@/lib/api/routes/account";
import { getErrorMessage } from "@/lib/get-error-message";
import { loadGoogleIdentity } from "@/lib/google-identity";
import { getGoogleClientId } from "@/lib/google-auth-config";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { useAuth } from "@/providers/auth-provider";

const GOOGLE_NOT_CONFIGURED_MESSAGE =
  "La connexion Google n'est pas configurée pour cette application admin. Définissez NEXT_PUBLIC_GOOGLE_CLIENT_ID dans apps/admin/.env.local (même valeur que l'application web).";

function GoogleLogo() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24">
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

export function SecurityConnectedAccountsCard() {
  const { user, refetchUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const hiddenButtonRef = useRef<HTMLDivElement>(null);
  const clientId = getGoogleClientId();
  const isConfigured = Boolean(clientId);

  const isLinked = Boolean(user?.googleId);

  const handleLinkCredential = useCallback(
    async (idToken: string) => {
      setIsLoading(true);
      try {
        await linkGoogleAccount(idToken);
        await refetchUser();
        showSuccessToast("Compte Google associé");
      } catch (err) {
        showErrorToast(
          "Impossible d'associer Google",
          getErrorMessage(err, "Réessayez."),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [refetchUser],
  );

  useEffect(() => {
    if (isLinked || !clientId) return;

    let cancelled = false;
    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !hiddenButtonRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            void handleLinkCredential(response.credential);
          },
        });
        window.google.accounts.id.renderButton(hiddenButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
        });
        setGoogleReady(true);
      })
      .catch(() => {
        showErrorToast(
          "Association Google indisponible",
          "Impossible de charger Google Identity Services.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isLinked, clientId, handleLinkCredential]);

  async function handleUnlink() {
    setIsLoading(true);
    try {
      await unlinkGoogleAccount();
      await refetchUser();
      showSuccessToast("Compte Google dissocié");
    } catch (err) {
      showErrorToast(
        "Impossible de dissocier Google",
        getErrorMessage(err, "Réessayez."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleLink() {
    if (!isConfigured) return;

    const realButton = hiddenButtonRef.current?.querySelector(
      'div[role="button"]',
    );
    if (realButton instanceof HTMLElement) {
      realButton.click();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Comptes connectés</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isConfigured && (
          <p className="text-muted-foreground text-xs">
            {GOOGLE_NOT_CONFIGURED_MESSAGE}
          </p>
        )}

        {!isLinked && isConfigured && (
          <div ref={hiddenButtonRef} className="hidden" />
        )}

        <div className="flex items-center gap-3">
          <GoogleLogo />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Google</p>
            <p className="text-muted-foreground text-xs">
              {isLinked
                ? "Connecté — vous pouvez vous connecter avec Google"
                : isConfigured
                  ? "Non connecté"
                  : "Non configuré"}
            </p>
          </div>
          {isLinked ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlink}
              disabled={isLoading}
              className="gap-1.5"
            >
              <Unlink className="size-3.5" />
              Dissocier
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLink}
              disabled={isLoading || !isConfigured || !googleReady}
              className="gap-1.5"
              title={!isConfigured ? GOOGLE_NOT_CONFIGURED_MESSAGE : undefined}
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Link2 className="size-3.5" />
              )}
              {isLoading ? "Association…" : "Associer Google"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
