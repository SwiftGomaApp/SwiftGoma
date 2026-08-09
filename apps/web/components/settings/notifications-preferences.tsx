"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { Loader2, ShieldAlert, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  notificationsApi,
  type NotificationPreference,
} from "@/lib/api/routes/notifications";
import { ApiException } from "@/lib/api";
import {
  getPushPermission,
  isPushSupported,
  loadOneSignal,
  requestPushPermission,
} from "@/lib/onesignal";

const NOTIFICATION_TYPES = [
  { key: "ORDER_STATUS", label: "Statut de commande" },
  { key: "PAYMENT", label: "Paiements" },
  { key: "ACCOUNT_SECURITY", label: "Sécurité du compte" },
  { key: "PROMO", label: "Promotions" },
  { key: "SELLER_ONBOARDING", label: "Inscription vendeur" },
  { key: "SUPPORT", label: "Support" },
  { key: "SYSTEM", label: "Système" },
] as const;

const FORCED_TYPES = ["ACCOUNT_SECURITY"];

const CHANNELS = [
  { key: "inApp", label: "App" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
  { key: "push", label: "Push" },
] as const;

type ChannelKey = (typeof CHANNELS)[number]["key"];

const DEFAULTS: Record<ChannelKey, boolean> = {
  inApp: true,
  email: true,
  sms: false,
  push: true,
};

function PreferencesSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-3 w-72 animate-pulse rounded bg-muted" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4">
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              </th>
              {CHANNELS.map((c) => (
                <th key={c.key} className="px-2 py-2">
                  <div className="mx-auto h-3 w-8 animate-pulse rounded bg-muted" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {NOTIFICATION_TYPES.map((type) => (
              <tr key={type.key}>
                <td className="py-3 pr-4">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                </td>
                {CHANNELS.map((channel) => (
                  <td key={channel.key} className="px-2 py-3 text-center">
                    <div className="mx-auto h-5 w-9 animate-pulse rounded-full bg-muted" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="h-3 w-56 animate-pulse rounded bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

export function NotificationsPreferences() {
  const [saved, setSaved] = useState<
    Record<string, NotificationPreference | null>
  >({});
  const [draft, setDraft] = useState<
    Record<string, Record<ChannelKey, boolean>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushPermission, setPushPermission] = useState<
    "default" | "granted" | "denied"
  >("default");
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    setPushPermission(getPushPermission());
  }, []);

  useEffect(() => {
    notificationsApi
      .getPreferences()
      .then((result) => {
        const byType: Record<string, NotificationPreference | null> = {};
        const draftByType: Record<string, Record<ChannelKey, boolean>> = {};
        for (const t of NOTIFICATION_TYPES) {
          const existing = result.find((p) => p.type === t.key) ?? null;
          byType[t.key] = existing;
          draftByType[t.key] = existing
            ? {
                inApp: existing.inApp,
                email: existing.email,
                sms: existing.sms,
                push: existing.push,
              }
            : { ...DEFAULTS };
        }
        setSaved(byType);
        setDraft(draftByType);
      })
      .catch((err) => {
        toast.error(
          err instanceof ApiException
            ? err.message
            : "Impossible de charger les préférences.",
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleEnablePush() {
    setIsRequestingPermission(true);
    try {
      const granted = await requestPushPermission();
      setPushPermission(getPushPermission());
      if (granted) {
        toast.success("Notifications push activées.");
      } else {
        toast.error(
          "Autorisation refusée. Activez-la dans les réglages de votre navigateur.",
        );
      }
    } finally {
      setIsRequestingPermission(false);
    }
  }

  async function handleToggle(
    type: string,
    channel: ChannelKey,
    checked: boolean,
  ) {
    // Turning ON a push toggle when the browser hasn't granted permission
    // yet — trigger the real prompt first, from this click (a genuine user
    // gesture), rather than silently saving a preference that can't fire.
    if (channel === "push" && checked && pushPermission !== "granted") {
      const granted = await requestPushPermission();
      setPushPermission(getPushPermission());
      if (!granted) {
        toast.error(
          "Activez les notifications push dans votre navigateur pour continuer.",
        );
        return; // don't flip the toggle if permission was refused
      }
    }

    setDraft((prev) => ({
      ...prev,
      [type]: { ...prev[type], [channel]: checked },
    }));
  }

  function isDirty(type: string) {
    const savedPref = saved[type];
    const savedValues = savedPref
      ? {
          inApp: savedPref.inApp,
          email: savedPref.email,
          sms: savedPref.sms,
          push: savedPref.push,
        }
      : DEFAULTS;
    const draftValues = draft[type];
    if (!draftValues) return false;
    return CHANNELS.some((c) => savedValues[c.key] !== draftValues[c.key]);
  }

  const hasChanges = NOTIFICATION_TYPES.some((t) => isDirty(t.key));

  async function handleSave() {
    const changedTypes = NOTIFICATION_TYPES.filter((t) => isDirty(t.key));
    if (changedTypes.length === 0) return;

    setIsSaving(true);
    try {
      const results = await Promise.all(
        changedTypes.map((t) =>
          notificationsApi.updatePreference({ type: t.key, ...draft[t.key] }),
        ),
      );
      setSaved((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          next[r.type] = r;
        });
        return next;
      });
      toast.success("Préférences enregistrées.");
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    // loadOneSignal();
    setPushPermission(getPushPermission());
  }, []);

  if (isLoading) {
    return <PreferencesSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Choisissez comment vous souhaitez être notifié pour chaque type
          d&apos;événement.
        </p>
      </div>

      {isPushSupported() && pushPermission !== "granted" && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
          {pushPermission === "denied" ? (
            <BellOff className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1">
            <p className="text-sm text-foreground">
              {pushPermission === "denied"
                ? "Notifications push bloquées"
                : "Notifications push désactivées"}
            </p>
            <p className="text-xs text-muted-foreground">
              {pushPermission === "denied"
                ? "Autorisez-les dans les réglages de votre navigateur pour ce site."
                : "Activez-les pour recevoir des alertes en temps réel."}
            </p>
          </div>
          {pushPermission !== "denied" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleEnablePush}
              disabled={isRequestingPermission}
            >
              {isRequestingPermission ? "..." : "Activer"}
            </Button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Type</th>
              {CHANNELS.map((c) => (
                <th key={c.key} className="px-2 py-2 text-center font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {NOTIFICATION_TYPES.map((type) => {
              const isForced = FORCED_TYPES.includes(type.key);
              const values = draft[type.key] ?? DEFAULTS;
              return (
                <tr key={type.key}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground">{type.label}</span>
                      {isForced && (
                        <ShieldAlert
                          className="h-3.5 w-3.5 text-muted-foreground"
                          aria-label="Toujours actif"
                        />
                      )}
                    </div>
                  </td>
                  {CHANNELS.map((channel) => (
                    <td key={channel.key} className="px-2 py-3 text-center">
                      <Switch
                        checked={values[channel.key]}
                        onCheckedChange={(checked) =>
                          handleToggle(type.key, channel.key, checked)
                        }
                        disabled={
                          channel.key === "push" && pushPermission === "denied"
                        }
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldAlert className="h-3.5 w-3.5" />
          Les alertes de sécurité restent toujours actives sur au moins un
          canal.
        </p>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
