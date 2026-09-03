"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link2, Loader2, Unlink } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { toast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/client";
import {
  linkAppleAccount,
  linkGoogleAccount,
  unlinkAppleAccount,
  unlinkGoogleAccount,
} from "@/lib/api/routes/users.routes";
import { loadAppleIdentity } from "@/lib/auth/apple-identity";
import { loadGoogleIdentity } from "@/lib/auth/google-identity";
import { useAuth } from "@/lib/auth/auth-context";
import { GoogleIcon } from "@/lib/constants/auth";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Connected accounts",
    description: "Sign in faster by linking Google or Apple to your account.",
    linked: "Connected",
    notLinked: "Not connected",
    link: "Connect",
    unlink: "Disconnect",
    unlinkConfirmTitle: "Disconnect this account?",
    unlinkConfirmDescription:
      "You won't be able to sign in with this provider anymore.",
    cancel: "Cancel",
    confirmUnlink: "Disconnect",
    genericError: "Something went wrong. Please try again.",
    cancelled: "Sign-in was cancelled.",
    notConfigured: "Not configured for this app.",
  },
  fr: {
    title: "Comptes connectés",
    description:
      "Connectez-vous plus vite en liant Google ou Apple à votre compte.",
    linked: "Connecté",
    notLinked: "Non connecté",
    link: "Connecter",
    unlink: "Déconnecter",
    unlinkConfirmTitle: "Déconnecter ce compte ?",
    unlinkConfirmDescription:
      "Vous ne pourrez plus vous connecter avec ce fournisseur.",
    cancel: "Annuler",
    confirmUnlink: "Déconnecter",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    cancelled: "La connexion a été annulée.",
    notConfigured: "Non configuré pour cette application.",
  },
} as const;

function extractMessage(err: unknown): string | undefined {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return undefined;
}

function AppleIcon() {
  return (
    <svg
      className="size-5 shrink-0"
      viewBox="0 0 384 512"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

export function SecurityConnectedAccounts({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const { user, refresh } = useAuth();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [appleLoading, setAppleLoading] = useState(false);
  const [appleReady, setAppleReady] = useState(false);

  const isGoogleLinked = Boolean(user?.googleId);
  const isAppleLinked = Boolean(user?.appleId);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setGoogleLoading(true);
      try {
        await linkGoogleAccount(idToken);
        await refresh();
        toast.add({ title: t.linked, type: "success" });
      } catch (err) {
        toast.add({
          title: t.genericError,
          description: extractMessage(err),
          type: "error",
        });
      } finally {
        setGoogleLoading(false);
      }
    },
    [refresh, t],
  );

  useEffect(() => {
    if (isGoogleLinked || !googleClientId) return;

    let cancelled = false;
    loadGoogleIdentity(locale)
      .then(() => {
        if (cancelled || !googleButtonRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            void handleGoogleCredential(response.credential);
          },
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
        });
        setGoogleReady(true);
      })
      .catch(() => {
        // Silently unavailable — the Connect button stays disabled below.
      });

    return () => {
      cancelled = true;
    };
  }, [isGoogleLinked, googleClientId, locale, handleGoogleCredential]);

  useEffect(() => {
    if (isAppleLinked || !appleClientId || !appleRedirectUri) return;

    let cancelled = false;
    loadAppleIdentity()
      .then(() => {
        if (cancelled || !window.AppleID) return;
        window.AppleID.auth.init({
          clientId: appleClientId,
          scope: "name email",
          redirectURI: appleRedirectUri,
          usePopup: true,
        });
        setAppleReady(true);
      })
      .catch(() => {
        // Silently unavailable — the Connect button stays disabled below.
      });

    return () => {
      cancelled = true;
    };
  }, [isAppleLinked, appleClientId, appleRedirectUri]);

  function handleGoogleLink() {
    const realButton =
      googleButtonRef.current?.querySelector('div[role="button"]');
    if (realButton instanceof HTMLElement) {
      realButton.click();
    }
  }

  async function handleAppleLink() {
    if (!window.AppleID) return;
    setAppleLoading(true);
    try {
      const response = await window.AppleID.auth.signIn();
      await linkAppleAccount(response.authorization.id_token);
      await refresh();
      toast.add({ title: t.linked, type: "success" });
    } catch (err) {
      const isCancelled =
        err instanceof Error && err.message?.includes("popup_closed");
      toast.add({
        title: isCancelled ? t.cancelled : t.genericError,
        description: isCancelled ? undefined : extractMessage(err),
        type: isCancelled ? "info" : "error",
      });
    } finally {
      setAppleLoading(false);
    }
  }

  async function handleGoogleUnlink() {
    setGoogleLoading(true);
    try {
      await unlinkGoogleAccount();
      await refresh();
      toast.add({ title: t.notLinked, type: "success" });
    } catch (err) {
      toast.add({
        title: t.genericError,
        description: extractMessage(err),
        type: "error",
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleAppleUnlink() {
    setAppleLoading(true);
    try {
      await unlinkAppleAccount();
      await refresh();
      toast.add({ title: t.notLinked, type: "success" });
    } catch (err) {
      toast.add({
        title: t.genericError,
        description: extractMessage(err),
        type: "error",
      });
    } finally {
      setAppleLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>

      {!isGoogleLinked && googleClientId && (
        <div ref={googleButtonRef} className="hidden" />
      )}

      <ItemGroup>
        <Item variant="outline">
          <ItemMedia variant="icon">
            <GoogleIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Google</ItemTitle>
            <ItemDescription>
              {isGoogleLinked
                ? t.linked
                : googleClientId
                  ? t.notLinked
                  : t.notConfigured}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            {isGoogleLinked ? (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={googleLoading}
                    />
                  }
                >
                  {googleLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Unlink className="size-3.5" />
                      {t.unlink}
                    </>
                  )}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.unlinkConfirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t.unlinkConfirmDescription}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleGoogleUnlink}>
                      {t.confirmUnlink}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoogleLink}
                disabled={googleLoading || !googleClientId || !googleReady}
              >
                {googleLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="size-3.5" />
                    {t.link}
                  </>
                )}
              </Button>
            )}
          </ItemActions>
        </Item>

        <Item variant="outline">
          <ItemMedia variant="icon">
            <AppleIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Apple</ItemTitle>
            <ItemDescription>
              {isAppleLinked
                ? t.linked
                : appleClientId
                  ? t.notLinked
                  : t.notConfigured}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            {isAppleLinked ? (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={appleLoading}
                    />
                  }
                >
                  {appleLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Unlink className="size-3.5" />
                      {t.unlink}
                    </>
                  )}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.unlinkConfirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t.unlinkConfirmDescription}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleAppleUnlink}>
                      {t.confirmUnlink}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAppleLink}
                disabled={appleLoading || !appleClientId || !appleReady}
              >
                {appleLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="size-3.5" />
                    {t.link}
                  </>
                )}
              </Button>
            )}
          </ItemActions>
        </Item>
      </ItemGroup>
    </section>
  );
}

export default SecurityConnectedAccounts;
