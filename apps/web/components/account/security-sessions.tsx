"use client";

import { useEffect, useState } from "react";
import { Laptop, Loader2, Smartphone } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
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
  listSessions,
  revokeSession,
  type SessionSummary,
} from "@/lib/api/routes/auth.routes";
import { useAuth } from "@/lib/auth/auth-context";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Active sessions",
    description: "Devices currently signed in to your account.",
    thisDevice: "This device",
    unknownDevice: "Unknown device",
    lastActive: "Last active",
    revoke: "Revoke",
    revokeConfirmTitle: "Revoke this session?",
    revokeConfirmDescription: "This device will be signed out immediately.",
    cancel: "Cancel",
    confirmRevoke: "Revoke session",
    logoutAll: "Log out of all devices",
    logoutAllConfirmTitle: "Log out everywhere?",
    logoutAllConfirmDescription:
      "You'll be signed out on every device, including this one, and will need to log in again.",
    confirmLogoutAll: "Log out everywhere",
    empty: "No active sessions found.",
    genericError: "Something went wrong. Please try again.",
  },
  fr: {
    title: "Sessions actives",
    description: "Appareils actuellement connectés à votre compte.",
    thisDevice: "Cet appareil",
    unknownDevice: "Appareil inconnu",
    lastActive: "Dernière activité",
    revoke: "Révoquer",
    revokeConfirmTitle: "Révoquer cette session ?",
    revokeConfirmDescription: "Cet appareil sera déconnecté immédiatement.",
    cancel: "Annuler",
    confirmRevoke: "Révoquer la session",
    logoutAll: "Se déconnecter de tous les appareils",
    logoutAllConfirmTitle: "Se déconnecter partout ?",
    logoutAllConfirmDescription:
      "Vous serez déconnecté de tous les appareils, y compris celui-ci, et devrez vous reconnecter.",
    confirmLogoutAll: "Se déconnecter partout",
    empty: "Aucune session active trouvée.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
  },
} as const;

function isMobileUserAgent(ua: string | null): boolean {
  if (!ua) return false;
  return /mobile|android|iphone/i.test(ua);
}

function formatDate(value: string | null, locale: Locale): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function extractMessage(err: unknown): string | undefined {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return undefined;
}

export function SecuritySessions({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const { logoutAll } = useAuth();

  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch(() => setSessions([]));
  }, []);

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev?.filter((s) => s.id !== sessionId) ?? null);
    } catch (err) {
      toast.add({
        title: t.genericError,
        description: extractMessage(err),
        type: "error",
      });
    } finally {
      setRevokingId(null);
    }
  }

  async function handleLogoutAll() {
    setLoggingOutAll(true);
    try {
      await logoutAll();
      window.location.href = "/auth/sign-in";
    } catch {
      setLoggingOutAll(false);
    }
  }

  if (sessions === null) {
    return (
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>

        {sessions.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
              {t.logoutAll}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.logoutAllConfirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.logoutAllConfirmDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <Button
                  variant="destructive"
                  disabled={loggingOutAll}
                  onClick={handleLogoutAll}
                >
                  {loggingOutAll && <Loader2 className="size-4 animate-spin" />}
                  {t.confirmLogoutAll}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ItemGroup>
          {sessions.map((session) => {
            const Icon = isMobileUserAgent(session.userAgent)
              ? Smartphone
              : Laptop;
            return (
              <Item key={session.id} variant="outline">
                <ItemMedia variant="icon">
                  <Icon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {session.deviceName ?? t.unknownDevice}
                    {session.isCurrent && (
                      <Badge variant="secondary">{t.thisDevice}</Badge>
                    )}
                  </ItemTitle>
                  <ItemDescription>
                    {session.ipAddress ?? "—"} · {t.lastActive}{" "}
                    {formatDate(session.lastUsedAt, locale)}
                  </ItemDescription>
                </ItemContent>
                {!session.isCurrent && (
                  <ItemActions>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={revokingId === session.id}
                          />
                        }
                      >
                        {revokingId === session.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          t.revoke
                        )}
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t.revokeConfirmTitle}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t.revokeConfirmDescription}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                          <Button onClick={() => handleRevoke(session.id)}>
                            {t.confirmRevoke}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </ItemActions>
                )}
              </Item>
            );
          })}
        </ItemGroup>
      )}
    </section>
  );
}

export default SecuritySessions;
