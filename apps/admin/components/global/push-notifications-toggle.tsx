"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isOneSignalConfigured,
  isPushSupported,
  getPushPermission,
  isPushUnavailable,
  requestPushPermission,
} from "@/lib/onesignal";
import { useAuth } from "@/providers/auth-provider";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";

export function PushNotificationsToggle() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<"default" | "granted" | "denied">(
    "default",
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isPushSupported()) {
      setPermission(getPushPermission());
    }
    setUnavailable(isPushUnavailable());
  }, []);

  // Keep SSR and the first client render identical — browser APIs differ.
  if (!mounted) return null;
  if (!user || !isOneSignalConfigured() || !isPushSupported()) return null;
  if (permission === "granted" || unavailable) return null;

  async function handleEnable() {
    if (!user) return;

    setIsRequesting(true);
    try {
      const granted = await requestPushPermission(user.id);
      if (granted) {
        setPermission("granted");
        showSuccessToast("Notifications push activées");
        return;
      }

      if (isPushUnavailable()) {
        setUnavailable(true);
        showErrorToast(
          "Push non configuré",
          "Ajoutez l'URL de cette application admin comme site Web dans les paramètres OneSignal.",
        );
        return;
      }

      const nextPermission = getPushPermission();
      setPermission(nextPermission);
      showErrorToast(
        "Notifications push bloquées",
        "Autorisez les notifications dans les paramètres de votre navigateur pour recevoir des alertes lorsque le panneau admin est fermé.",
      );
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isRequesting || permission === "denied"}
      onClick={handleEnable}
      title={
        permission === "denied"
          ? "Notifications bloquées dans les paramètres du navigateur"
          : "Activer les notifications push du navigateur"
      }
    >
      <BellRing className="mr-1.5 h-3.5 w-3.5" />
      {permission === "denied" ? "Push bloqué" : "Activer le push"}
    </Button>
  );
}
