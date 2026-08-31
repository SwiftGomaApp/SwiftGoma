"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, ShieldAlert } from "lucide-react";
import OneSignal from "react-onesignal";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Push notifications",
    enabledDescription: "Push notifications are enabled on this device.",
    disabledDescription:
      "Enable push notifications to get alerts even when SwiftGoma isn't open.",
    blockedDescription:
      "You've blocked notifications for this site. Update your browser's site settings to enable them.",
    unsupportedDescription:
      "Push notifications aren't supported in this browser.",
    enable: "Enable notifications",
    enabling: "Enabling…",
    deniedTitle: "Permission denied",
    deniedDescription: "You didn't allow notifications for this site.",
  },
  fr: {
    title: "Notifications push",
    enabledDescription:
      "Les notifications push sont activées sur cet appareil.",
    disabledDescription:
      "Activez les notifications push pour recevoir des alertes même quand SwiftGoma n'est pas ouvert.",
    blockedDescription:
      "Vous avez bloqué les notifications pour ce site. Modifiez les paramètres de votre navigateur pour les activer.",
    unsupportedDescription:
      "Les notifications push ne sont pas prises en charge par ce navigateur.",
    enable: "Activer les notifications",
    enabling: "Activation…",
    deniedTitle: "Autorisation refusée",
    deniedDescription:
      "Vous n'avez pas autorisé les notifications pour ce site.",
  },
} as const;

type PushStatus =
  | "loading"
  | "unsupported"
  | "blocked"
  | "subscribed"
  | "unsubscribed";

export function PushNotificationStatus({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const [status, setStatus] = useState<PushStatus>("loading");
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    function evaluate() {
      const supported = OneSignal.Notifications.isPushSupported();

      if (!supported) {
        setStatus("unsupported");
        return;
      }
      if (OneSignal.Notifications.permissionNative === "denied") {
        setStatus("blocked");
        return;
      }
      setStatus(
        OneSignal.User.PushSubscription.optedIn ? "subscribed" : "unsubscribed",
      );
    }

    evaluate();

    OneSignal.User.PushSubscription.addEventListener("change", evaluate);
    OneSignal.Notifications.addEventListener("permissionChange", evaluate);

    return () => {
      OneSignal.User.PushSubscription.removeEventListener("change", evaluate);
      OneSignal.Notifications.removeEventListener("permissionChange", evaluate);
    };
  }, []);

  async function handleEnable() {
    setIsEnabling(true);
    try {
      const granted = await OneSignal.Notifications.requestPermission();
      if (!granted) {
        toast.add({
          title: t.deniedTitle,
          description: t.deniedDescription,
          type: "warning",
        });
      }
    } catch (err) {
      console.error("[push] requestPermission failed:", err);
    } finally {
      setIsEnabling(false);
    }
  }

  const description =
    status === "subscribed"
      ? t.enabledDescription
      : status === "blocked"
        ? t.blockedDescription
        : status === "unsupported"
          ? t.unsupportedDescription
          : t.disabledDescription;

  const Icon =
    status === "subscribed"
      ? BellRing
      : status === "blocked"
        ? ShieldAlert
        : BellOff;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
      <div className="flex items-start gap-3">
        <Icon
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-medium text-foreground">{t.title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {status === "unsubscribed" && (
        <Button
          type="button"
          size="sm"
          onClick={handleEnable}
          disabled={isEnabling}
        >
          {isEnabling ? t.enabling : t.enable}
        </Button>
      )}
    </div>
  );
}
