declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

let scriptLoaded = false;

export function loadOneSignal() {
  if (scriptLoaded || typeof window === "undefined") return;

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) {
    console.error(
      "[onesignal] NEXT_PUBLIC_ONESIGNAL_APP_ID is not set — push notifications will not work.",
    );
    return;
  }

  scriptLoaded = true;

  const script = document.createElement("script");
  script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
  script.defer = true;
  script.onerror = () => {
    console.error("[onesignal] Failed to load the OneSignal SDK script.");
  };
  document.head.appendChild(script);

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
      });
    } catch (err) {
      console.error("[onesignal] init() failed:", err);
    }
  });
}

export function oneSignalLogin(userId: string) {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push((OneSignal: any) => {
    OneSignal.login(userId);
  });
}

export function oneSignalLogout() {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push((OneSignal: any) => {
    OneSignal.logout();
  });
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window;
}

export function getPushPermission(): "default" | "granted" | "denied" {
  if (!isPushSupported()) return "denied";
  return Notification.permission;
}

export function requestPushPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isPushSupported()) {
      console.warn(
        "[onesignal] Push notifications are not supported in this browser.",
      );
      resolve(false);
      return;
    }
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      console.error(
        "[onesignal] Cannot request permission — App ID is not configured.",
      );
      resolve(false);
      return;
    }

    // Make sure the SDK has actually been asked to load — safe to call
    // repeatedly, loadOneSignal() no-ops if already loaded.
    loadOneSignal();

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        const granted = await OneSignal.Notifications.requestPermission();
        resolve(Boolean(granted));
      } catch (err) {
        console.error("[onesignal] requestPermission() failed:", err);
        resolve(false);
      }
    });
  });
}
