"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck, ShieldOff, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  listSessions,
  revokeSession,
  logoutAll,
  updatePassword,
  setupTotp,
  confirmTotp,
  disableTotp,
  type Session,
  type SetupTotpResponse,
} from "@/lib/api/routes/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import { SecurityPasskeysCard } from "@/components/settings/security-passkeys";
import { SecurityConnectedAccountsCard } from "@/components/settings/security-connected-accounts";
import { formatDateTime } from "@/lib/i18n/format";
import { ui } from "@/lib/i18n/common";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

function SessionsCard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setSessions(await listSessions());
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les sessions."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  async function handleRevoke(id: string) {
    setBusyId(id);
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(getErrorMessage(err, "Impossible de révoquer cette session."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleLogoutAll() {
    if (!confirm("Se déconnecter de toutes les autres sessions ? Vous resterez connecté ici."))
      return;
    try {
      await logoutAll();
      await load();
    } catch (err) {
      alert(getErrorMessage(err, "Impossible de déconnecter les autres sessions."));
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Sessions actives</CardTitle>
        <Button variant="outline" size="sm" onClick={handleLogoutAll}>
          Déconnecter les autres sessions
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune session trouvée.</p>
        ) : (
          <div className="flex flex-col divide-y">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Monitor className="text-muted-foreground h-4 w-4" />
                  <div className="flex flex-col">
                    <span>
                      {session.deviceName ?? session.userAgent ?? "Appareil inconnu"}{" "}
                      {session.isCurrent && (
                        <Badge variant="outline" className="ml-1 text-[10px]">
                          Cet appareil
                        </Badge>
                      )}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {session.ipAddress ?? "IP inconnue"} · dernière utilisation{" "}
                      {formatDateTime(session.lastUsedAt)}
                    </span>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === session.id}
                    onClick={() => handleRevoke(session.id)}
                  >
                    Révoquer
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de mettre à jour le mot de passe."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Mot de passe</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <Input
            type="password"
            placeholder="Mot de passe actuel"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-48"
            required
          />
          <Input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-48"
            required
          />
          <Button type="submit" disabled={isSaving}>
            Mettre à jour le mot de passe
          </Button>
        </form>
        {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
        {success && <p className="mt-2 text-sm text-emerald-600">Mot de passe mis à jour.</p>}
      </CardContent>
    </Card>
  );
}

function TotpCard() {
  const { user, refetchUser } = useAuth();
  const enabled = Boolean(user?.twoFactorEnabled);

  const [setupData, setSetupData] = useState<SetupTotpResponse | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disableCode, setDisableCode] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartSetup() {
    setError(null);
    setIsBusy(true);
    try {
      setSetupData(await setupTotp());
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de démarrer la configuration 2FA."));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      const result = await confirmTotp(confirmCode);
      setBackupCodes(result.backupCodes);
      setSetupData(null);
      setConfirmCode("");
      await refetchUser();
    } catch (err) {
      setError(getErrorMessage(err, "Code invalide."));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Désactiver l'authentification à deux facteurs ?")) return;
    setError(null);
    setIsBusy(true);
    try {
      await disableTotp(disableCode);
      setDisableCode("");
      await refetchUser();
    } catch (err) {
      setError(getErrorMessage(err, "Code invalide."));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          Authentification à deux facteurs
          {enabled ? (
            <Badge variant="default">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Activée
            </Badge>
          ) : (
            <Badge variant="secondary">
              <ShieldOff className="mr-1 h-3 w-3" />
              Désactivée
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && <p className="text-destructive text-sm">{error}</p>}

        {backupCodes && (
          <div className="rounded-md border p-3">
            <p className="text-sm font-medium">
              Conservez ces codes de secours en lieu sûr — chacun ne peut être
              utilisé qu'une fois si vous perdez l'accès à votre application
              d'authentification.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
              {backupCodes.map((code) => (
                <span key={code}>{code}</span>
              ))}
            </div>
          </div>
        )}

        {enabled ? (
          <form onSubmit={handleDisable} className="flex items-end gap-2">
            <Input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="Code d'authentification"
              className="w-40"
              inputMode="numeric"
              maxLength={6}
            />
            <Button type="submit" variant="destructive" disabled={isBusy || !disableCode}>
              Désactiver la 2FA
            </Button>
          </form>
        ) : setupData ? (
          <div className="flex flex-col gap-3">
            <Image
              src={setupData.qrCodeDataUrl}
              alt="Code QR TOTP"
              width={180}
              height={180}
              unoptimized
            />
            <p className="text-muted-foreground text-xs">
              Clé de saisie manuelle :{" "}
              <span className="font-mono">{setupData.manualEntryKey}</span>
            </p>
            <form onSubmit={handleConfirm} className="flex items-end gap-2">
              <Input
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="Code à 6 chiffres"
                className="w-40"
                inputMode="numeric"
                maxLength={6}
                autoFocus
              />
              <Button type="submit" disabled={isBusy || !confirmCode}>
                {ui.confirm}
              </Button>
            </form>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={isBusy}
            onClick={handleStartSetup}
          >
            Configurer la 2FA
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function AccountSecurityPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Profil et sécurité</h1>
        {user && (
          <p className="text-muted-foreground text-sm">
            {user.name} · {user.email ?? "aucun e-mail enregistré"}
          </p>
        )}
      </div>

      <TotpCard />
      <SecurityConnectedAccountsCard />
      <SecurityPasskeysCard />
      <PasswordCard />
      <SessionsCard />
    </div>
  );
}
