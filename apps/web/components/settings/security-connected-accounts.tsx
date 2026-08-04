"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { Link2, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { userApi } from "@/lib/api/routes/user";
import { ApiException } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { loadGoogleIdentity } from "@/lib/google-identity";

export function SecurityConnectedAccounts() {
  const { user, refresh } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const hiddenButtonRef = useRef<HTMLDivElement>(null);

  const isLinked = Boolean(user?.googleId);

  const handleLinkCredential = useCallback(
    async (idToken: string) => {
      setIsLoading(true);
      try {
        await userApi.linkGoogleAccount(idToken);
        toast.success("Compte Google connecté.");
        await refresh();
      } catch (err) {
        toast.error(
          err instanceof ApiException
            ? err.message
            : "Une erreur est survenue.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [refresh],
  );

  useEffect(() => {
    if (isLinked) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error(
        "[google-auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set — Google linking will not work.",
      );
      return;
    }

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
        toast.error("Impossible de charger la connexion Google.");
      });

    return () => {
      cancelled = true;
    };
  }, [isLinked, handleLinkCredential]);

  async function handleUnlink() {
    setIsLoading(true);
    try {
      await userApi.unlinkGoogleAccount();
      toast.success("Compte Google dissocié.");
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleLink() {
    const realButton = hiddenButtonRef.current?.querySelector(
      'div[role="button"]',
    );
    if (realButton instanceof HTMLElement) {
      realButton.click();
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground">
        Comptes connectés
      </h3>

      {!isLinked && <div ref={hiddenButtonRef} className="hidden" />}

      <div className="flex items-center gap-3">
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Google</p>
          <p className="text-xs text-muted-foreground">
            {isLinked ? "Connecté" : "Non connecté"}
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
            <Unlink className="h-3.5 w-3.5" />
            Dissocier
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLink}
            disabled={isLoading || !googleReady}
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            {isLoading ? "Connexion..." : "Connecter"}
          </Button>
        )}
      </div>
    </div>
  );
}
