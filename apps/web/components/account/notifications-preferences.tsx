"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/client";
import {
  FORCED_NOTIFICATION_TYPES,
  NOTIFICATION_TYPES,
  getNotificationPreferences,
  updateNotificationPreference,
  type NotificationPreference,
  type NotificationType,
} from "@/lib/api/routes/notifications.routes";
import type { Locale } from "@/lib/language";

type PreferenceRow = Omit<NotificationPreference, "type">;

const DEFAULT_PREFERENCE: PreferenceRow = {
  inApp: true,
  email: true,
  sms: false,
  push: true,
};

const CHANNELS = ["inApp", "email", "sms", "push"] as const;

const TYPE_LABELS: Record<Locale, Record<NotificationType, string>> = {
  en: {
    ORDER_STATUS: "Order updates",
    ORDER_MESSAGE: "Order messages",
    PAYMENT: "Payments",
    ACCOUNT_SECURITY: "Account security",
    PROMO: "Promotions",
    SELLER_ONBOARDING: "Seller onboarding",
    SUPPORT: "Support",
    SYSTEM: "System",
  },
  fr: {
    ORDER_STATUS: "Suivi de commande",
    ORDER_MESSAGE: "Messages de commande",
    PAYMENT: "Paiements",
    ACCOUNT_SECURITY: "Sécurité du compte",
    PROMO: "Promotions",
    SELLER_ONBOARDING: "Intégration vendeur",
    SUPPORT: "Support",
    SYSTEM: "Système",
  },
};

const STRINGS = {
  en: {
    typeColumn: "Notification type",
    inApp: "In-app",
    email: "Email",
    sms: "SMS",
    push: "Push",
    forcedNote: "Security notifications can't be turned off.",
    genericError: "Couldn't save that. Please try again.",
  },
  fr: {
    typeColumn: "Type de notification",
    inApp: "Dans l'app",
    email: "E-mail",
    sms: "SMS",
    push: "Push",
    forcedNote:
      "Les notifications de sécurité ne peuvent pas être désactivées.",
    genericError: "Impossible d'enregistrer. Veuillez réessayer.",
  },
} as const;

function extractMessage(err: unknown): string | undefined {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return undefined;
}

export function NotificationsPreferences({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const labels = TYPE_LABELS[locale];

  const { user } = useAuth();

  const visibleTypes = NOTIFICATION_TYPES.filter(
    (type) => type !== "SELLER_ONBOARDING" || user?.role === "SELLER",
  );

  const [preferences, setPreferences] = useState<Record<
    NotificationType,
    PreferenceRow
  > | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    function buildDefaults(): Record<NotificationType, PreferenceRow> {
      const merged = {} as Record<NotificationType, PreferenceRow>;
      for (const type of NOTIFICATION_TYPES) {
        merged[type] = { ...DEFAULT_PREFERENCE };
      }
      return merged;
    }

    getNotificationPreferences()
      .then((rows) => {
        const merged = buildDefaults();
        for (const row of rows) {
          merged[row.type] = {
            inApp: row.inApp,
            email: row.email,
            sms: row.sms,
            push: row.push,
          };
        }
        setPreferences(merged);
      })
      .catch(() => setPreferences(buildDefaults()));
  }, []);

  async function handleToggle(
    type: NotificationType,
    channel: (typeof CHANNELS)[number],
    checked: boolean,
  ) {
    if (!preferences) return;
    const key = `${type}-${channel}`;
    const previous = preferences[type];

    setPreferences({
      ...preferences,
      [type]: { ...previous, [channel]: checked },
    });
    setSavingKey(key);

    try {
      await updateNotificationPreference({ type, [channel]: checked });
    } catch (err) {
      setPreferences((prev) => (prev ? { ...prev, [type]: previous } : prev));
      toast.add({
        title: t.genericError,
        description: extractMessage(err),
        type: "error",
      });
    } finally {
      setSavingKey(null);
    }
  }

  if (!preferences) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2 pr-4 font-medium">{t.typeColumn}</th>
            <th className="w-20 px-2 py-2 text-center font-medium whitespace-nowrap">{t.inApp}</th>
            <th className="w-20 px-2 py-2 text-center font-medium whitespace-nowrap">{t.email}</th>
            <th className="w-20 px-2 py-2 text-center font-medium whitespace-nowrap">{t.sms}</th>
            <th className="w-20 px-2 py-2 text-center font-medium whitespace-nowrap">{t.push}</th>
          </tr>
        </thead>
        <tbody>
          {visibleTypes.map((type) => {
            const pref = preferences[type];
            const isForced = FORCED_NOTIFICATION_TYPES.includes(type);
            return (
              <tr
                key={type}
                className="border-b border-border last:border-none"
              >
                <td className="py-3 pr-4">
                  <span className="font-medium text-foreground">
                    {labels[type]}
                  </span>
                  {isForced && (
                    <p className="text-xs text-muted-foreground">
                      {t.forcedNote}
                    </p>
                  )}
                </td>
                {CHANNELS.map((channel) => (
                  <td key={channel} className="px-2 py-3 text-center">
                    <Switch
                      checked={pref[channel]}
                      disabled={isForced || savingKey === `${type}-${channel}`}
                      onCheckedChange={(checked) =>
                        handleToggle(type, channel, Boolean(checked))
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
  );
}

export default NotificationsPreferences;
