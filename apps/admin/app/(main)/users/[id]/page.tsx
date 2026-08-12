"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail, Phone, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  getUser,
  blockUser,
  unblockUser,
  forceLogoutUser,
  verifyUserEmail,
  verifyUserPhone,
  deleteUser,
  restoreUser,
  changeUserRole,
  type UserDetail,
  type UserRole,
} from "@/lib/api/routes/users";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import { formatDateTime } from "@/lib/i18n/format";
import { labelOf, userRoleLabels } from "@/lib/i18n/labels";
import { ui } from "@/lib/i18n/common";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

const ROLES: UserRole[] = [
  "BUYER",
  "SELLER",
  "RIDER",
  "ADMIN",
  "SUPPORT",
  "ACCOUNTANT",
];
const PRIVILEGED_ROLES: UserRole[] = ["ADMIN", "SUPPORT", "ACCOUNTANT"];

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [newRole, setNewRole] = useState<UserRole | "">("");

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUser(params.id);
      setUser(result);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger cet utilisateur."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  const isSelf = currentUser?.id === user?.id;
  const isRestricted =
    currentUser?.role === "SUPPORT" &&
    user !== null &&
    PRIVILEGED_ROLES.includes(user.role);
  const canAct = !isSelf && !isRestricted;
  const isAdmin = currentUser?.role === "ADMIN";

  async function runAction<T>(action: () => Promise<T>, onDone?: () => void) {
    setActionError(null);
    setIsActing(true);
    try {
      await action();
      await load();
      onDone?.();
    } catch (err) {
      setActionError(getErrorMessage(err, "Cette action a échoué."));
    } finally {
      setIsActing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col gap-3">
        <Link
          href="/users"
          className="text-muted-foreground text-sm hover:underline"
        >
          <ArrowLeft className="mr-1 inline h-3.5 w-3.5" />
          Retour aux utilisateurs
        </Link>
        <p className="text-destructive text-sm">
          {error ?? "Utilisateur introuvable."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/users"
            className="text-muted-foreground text-xs hover:underline"
          >
            <ArrowLeft className="mr-1 inline h-3 w-3" />
            Retour aux utilisateurs
          </Link>
          <h1 className="mt-1 text-xl font-bold">{user.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">
              {labelOf(userRoleLabels, user.role)}
            </Badge>
            {user.deletedAt ? (
              <Badge variant="destructive">Supprimé</Badge>
            ) : user.isBlocked ? (
              <Badge variant="destructive">{ui.blocked}</Badge>
            ) : (
              <Badge variant="secondary">{ui.active}</Badge>
            )}
          </div>
        </div>

        {!canAct && (
          <p className="text-muted-foreground max-w-xs text-right text-xs">
            {isSelf
              ? "Vous ne pouvez pas agir sur votre propre compte ici."
              : "Le support ne peut pas agir sur les comptes ADMIN/SUPPORT."}
          </p>
        )}
      </div>

      {actionError && <p className="text-destructive text-sm">{actionError}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{ui.contact}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {user.emails.length === 0 && (
              <p className="text-muted-foreground">Aucun e-mail enregistré.</p>
            )}
            {user.emails.map((email) => (
              <div key={email.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="text-muted-foreground h-3.5 w-3.5" />
                  <span>{email.email}</span>
                  {email.isPrimary && (
                    <Badge variant="outline" className="text-[10px]">
                      Principal
                    </Badge>
                  )}
                </div>
                {email.isVerified ? (
                  <Badge variant="secondary">Vérifié</Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isActing || !canAct}
                    onClick={() =>
                      runAction(() => verifyUserEmail(user.id, email.id))
                    }
                  >
                    Marquer vérifié
                  </Button>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground h-3.5 w-3.5" />
                <span>{user.phone ?? "Aucun téléphone enregistré"}</span>
              </div>
              {user.phone &&
                (user.isPhoneVerified ? (
                  <Badge variant="secondary">Vérifié</Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isActing || !canAct}
                    onClick={() => runAction(() => verifyUserPhone(user.id))}
                  >
                    Marquer vérifié
                  </Button>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Actions sur le compte</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {user.isBlocked ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isActing || !canAct}
                  onClick={() => runAction(() => unblockUser(user.id))}
                >
                  Débloquer
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isActing || !canAct}
                  onClick={() => {
                    if (
                      !confirm(
                        `Bloquer ${user.name} ? Toutes ses sessions seront révoquées.`,
                      )
                    )
                      return;
                    runAction(() => blockUser(user.id));
                  }}
                >
                  Bloquer
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                disabled={isActing || !canAct}
                onClick={() => {
                  if (
                    !confirm(`Déconnecter ${user.name} de tous ses appareils ?`)
                  )
                    return;
                  runAction(() => forceLogoutUser(user.id));
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Déconnexion forcée (toutes sessions)
              </Button>

              {isAdmin &&
                (user.deletedAt ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isActing || !canAct}
                    onClick={() => runAction(() => restoreUser(user.id))}
                  >
                    Restaurer le compte
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isActing || !canAct}
                    onClick={() => {
                      if (
                        !confirm(
                          `Supprimer le compte de ${user.name} ? Cette action peut être annulée ultérieurement.`,
                        )
                      )
                        return;
                      runAction(
                        () => deleteUser(user.id),
                        () => router.refresh(),
                      );
                    }}
                  >
                    Supprimer le compte
                  </Button>
                ))}
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 border-t pt-3">
                <ShieldCheck className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                <NativeSelect
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole | "")}
                  className="w-36"
                  disabled={isActing || !canAct}
                >
                  <NativeSelectOption value="">
                    Changer le rôle…
                  </NativeSelectOption>
                  {ROLES.filter((r) => r !== user.role).map((r) => (
                    <NativeSelectOption key={r} value={r}>
                      {labelOf(userRoleLabels, r)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isActing || !canAct || !newRole}
                  onClick={() => {
                    if (!newRole) return;
                    if (
                      !confirm(
                        `Changer le rôle de ${user.name} en ${labelOf(userRoleLabels, newRole)} ?`,
                      )
                    )
                      return;
                    runAction(
                      () => changeUserRole(user.id, newRole),
                      () => setNewRole(""),
                    );
                  }}
                >
                  {ui.apply}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Sessions ({user.sessions.filter((s) => !s.isRevoked).length}{" "}
            actives)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune session enregistrée.
            </p>
          ) : (
            <div className="flex flex-col divide-y">
              {user.sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div className="flex flex-col">
                    <span>
                      {session.deviceName ??
                        session.userAgent ??
                        "Appareil inconnu"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {session.ipAddress ?? "IP inconnue"} · dernière
                      utilisation {formatDateTime(session.lastUsedAt)}
                    </span>
                  </div>
                  {session.isRevoked ? (
                    <Badge variant="secondary">Révoquée</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isActing || !canAct}
                      onClick={() =>
                        runAction(() =>
                          forceLogoutUser(user.id, { sessionId: session.id }),
                        )
                      }
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Actions admin récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {user.actionsReceived.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune action effectuée sur ce compte pour le moment.
            </p>
          ) : (
            <div className="flex flex-col divide-y">
              {user.actionsReceived.map((entry) => (
                <div key={entry.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{entry.action}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </div>
                  {entry.reason && (
                    <p className="text-muted-foreground text-xs">
                      Motif : {entry.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
