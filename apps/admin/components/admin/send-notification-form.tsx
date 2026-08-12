"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sendNotification, type NotificationType } from "@/lib/api/routes/notifications";
import { listUsers, type UserListItem } from "@/lib/api/routes/users";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ApiError } from "@/lib/api/client";
import { labelOf, notificationTypeLabels, userRoleLabels } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

const TYPES: NotificationType[] = [
  "ORDER_STATUS",
  "PAYMENT",
  "ACCOUNT_SECURITY",
  "PROMO",
  "SELLER_ONBOARDING",
  "SUPPORT",
  "SYSTEM",
];

type SendFormState = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  dataJson: string;
};

const EMPTY_FORM: SendFormState = {
  userId: "",
  type: "SYSTEM",
  title: "",
  body: "",
  dataJson: "",
};

export function SendNotificationForm() {
  const [form, setForm] = useState<SendFormState>(EMPTY_FORM);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserListItem[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showUserResults, setShowUserResults] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (userQuery.trim().length < 2) {
      setUserResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const result = await listUsers({ search: userQuery.trim(), limit: 8 });
        setUserResults(result.users);
        setShowUserResults(true);
      } catch {
        setUserResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [userQuery]);

  function selectUser(user: UserListItem) {
    setSelectedUser(user);
    setForm((prev) => ({ ...prev, userId: user.id }));
    setUserQuery(user.name);
    setShowUserResults(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let data: unknown;
    if (form.dataJson.trim()) {
      try {
        data = JSON.parse(form.dataJson);
      } catch {
        showErrorToast(
          "JSON invalide",
          "Le champ de données facultatif doit contenir du JSON valide.",
        );
        return;
      }
    }

    setIsSending(true);
    try {
      await sendNotification({
        userId: form.userId,
        type: form.type,
        title: form.title.trim(),
        body: form.body.trim(),
        data,
      });
      showSuccessToast(
        "Notification envoyée",
        selectedUser
          ? `Envoyée à ${selectedUser.name} via ses canaux activés (application, push, e-mail, SMS).`
          : "Envoyée via les canaux activés du destinataire.",
      );
      setForm(EMPTY_FORM);
      setSelectedUser(null);
      setUserQuery("");
    } catch (err) {
      showErrorToast(
        "Impossible d'envoyer la notification",
        getErrorMessage(err, ""),
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Envoyer une notification</CardTitle>
        <CardDescription>
          Envoi à un utilisateur selon ses préférences — dans l'application
          (Socket.io), notifications push du navigateur (OneSignal), e-mail et
          SMS lorsque activés.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="recipient">Destinataire</Label>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
              <Input
                id="recipient"
                value={userQuery}
                onChange={(e) => {
                  setUserQuery(e.target.value);
                  setSelectedUser(null);
                  setForm((prev) => ({ ...prev, userId: "" }));
                }}
                onFocus={() => userResults.length > 0 && setShowUserResults(true)}
                placeholder="Rechercher par nom, e-mail ou téléphone…"
                className="pl-8"
                autoComplete="off"
                required={!form.userId}
              />
              {isSearchingUsers && (
                <Loader2 className="text-muted-foreground absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 animate-spin" />
              )}
              {showUserResults && userResults.length > 0 && (
                <ul className="bg-popover absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border shadow-md">
                  {userResults.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        className={cn(
                          "hover:bg-muted flex w-full flex-col px-3 py-2 text-left text-sm",
                          form.userId === user.id && "bg-muted",
                        )}
                        onClick={() => selectUser(user)}
                      >
                        <span className="font-medium">{user.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {user.email ?? user.phone ?? user.id} ·{" "}
                          {labelOf(userRoleLabels, user.role)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedUser && (
              <p className="text-muted-foreground text-xs">
                Sélectionné :{" "}
                <Link href={`/users/${selectedUser.id}`} className="text-primary hover:underline">
                  {selectedUser.name}
                </Link>{" "}
                ({selectedUser.id})
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <NativeSelect
                id="type"
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value as NotificationType,
                  }))
                }
              >
                {TYPES.map((t) => (
                  <NativeSelectOption key={t} value={t}>
                    {labelOf(notificationTypeLabels, t)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Titre de la notification"
                required
                maxLength={120}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={form.body}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, body: e.target.value }))
              }
              placeholder="Rédigez le message de la notification…"
              required
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="data">Données facultatives (JSON)</Label>
            <Textarea
              id="data"
              value={form.dataJson}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, dataJson: e.target.value }))
              }
              placeholder='{"orderId": "..."}'
              rows={3}
              className="font-mono text-xs"
            />
            <p className="text-muted-foreground text-xs">
              Utilisées pour les liens profonds ou le contexte supplémentaire dans
              les applications clientes.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSending || !form.userId}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer la notification
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
