"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { Monitor, Smartphone, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi, type Session } from "@/lib/api/routes/auth";
import { ApiException } from "@/lib/api";

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

function deviceLabel(userAgent: string | null) {
  if (!userAgent) return "Appareil inconnu";
  if (/mobile|android/i.test(userAgent)) return "Mobile";
  if (/mac/i.test(userAgent)) return "Mac";
  if (/windows/i.test(userAgent)) return "Windows";
  return "Ordinateur";
}

export function DevicesSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  useEffect(() => {
    authApi
      .listSessions()
      .then((result) => setSessions(result))
      .catch((err) => {
        toast.error(
          err instanceof ApiException ? err.message : "Une erreur est survenue.",
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId);
    try {
      await authApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session déconnectée.");
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setRevokingId(null);
    }
  }

  async function handleLogoutAll() {
    setLoggingOutAll(true);
    try {
      await authApi.logoutAll();
      toast.success("Déconnecté de tous les appareils.");
      window.location.href = "/auth/sign-in";
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setLoggingOutAll(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Appareils et sessions
        </h3>
        <p className="text-sm text-muted-foreground">
          Gérez les appareils connectés à votre compte.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-center gap-3 py-3">
              {deviceLabel(session.userAgent) === "Mobile" ? (
                <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {session.deviceName ?? deviceLabel(session.userAgent)}
                  {session.isCurrent && (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Cet appareil
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Dernière activité : {formatRelativeTime(session.lastUsedAt)}
                  {session.ipAddress && ` · ${session.ipAddress}`}
                </p>
              </div>
              {!session.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleRevoke(session.id)}
                  disabled={revokingId === session.id}
                  aria-label="Déconnecter"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="outline"
        onClick={handleLogoutAll}
        disabled={loggingOutAll}
        className="self-start gap-2"
      >
        <LogOut className="h-4 w-4" />
        {loggingOutAll
          ? "Déconnexion..."
          : "Se déconnecter de tous les appareils"}
      </Button>
    </div>
  );
}
