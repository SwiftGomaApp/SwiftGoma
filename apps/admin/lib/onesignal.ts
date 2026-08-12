interface OneSignalSDK {
  init(options: {
    appId: string;
    allowLocalhostAsSecureOrigin?: boolean;
  }): Promise<void>;
  login(externalId: string): void;
  logout(): void;
  Notifications: {
    requestPermission(): Promise<boolean>;
  };
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalSDK) => void>;
  }
}

let scriptLoading: Promise<void> | null = null;
let initPromise: Promise<boolean> | null = null;
let pushUnavailable = false;

export function isOneSignalConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID);
}

function isWebPushConfigError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.toLowerCase().includes("not configured for web push");
}

function loadOneSignalScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OneSignal is browser-only."));
  }

  if (scriptLoading) return scriptLoading;

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) {
    return Promise.reject(new Error("OneSignal app ID is not configured."));
  }

  scriptLoading = new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="OneSignalSDK.page.js"]')) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoading = null;
      reject(new Error("Failed to load the OneSignal SDK script."));
    };
    document.head.appendChild(script);
  });

  return scriptLoading;
}

function runWithOneSignal<T>(
  runner: (OneSignal: OneSignalSDK) => Promise<T> | T,
): Promise<T> {
  return new Promise((resolve, reject) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        resolve(await runner(OneSignal));
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function ensureOneSignalReady(userId?: string): Promise<boolean> {
  if (pushUnavailable || !isOneSignalConfigured()) return false;
  if (typeof window === "undefined") return false;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        await loadOneSignalScript();

        await runWithOneSignal(async (OneSignal) => {
          await OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
            allowLocalhostAsSecureOrigin:
              process.env.NODE_ENV === "development",
          });
        });

        if (userId) {
          await runWithOneSignal((OneSignal) => {
            OneSignal.login(userId);
          });
        }

        return true;
      } catch (err) {
        initPromise = null;
        if (isWebPushConfigError(err)) {
          pushUnavailable = true;
          console.warn(
            "[onesignal] Web push is not configured for this site in the OneSignal dashboard.",
          );
        } else {
          console.warn("[onesignal] init() failed:", err);
        }
        return false;
      }
    })();
  }

  return initPromise;
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window;
}

export function getPushPermission(): "default" | "granted" | "denied" {
  if (!isPushSupported()) return "denied";
  return Notification.permission;
}

export function isPushUnavailable(): boolean {
  return pushUnavailable;
}

export async function requestPushPermission(userId: string): Promise<boolean> {
  if (!isPushSupported() || !isOneSignalConfigured() || pushUnavailable) {
    return false;
  }

  const ready = await ensureOneSignalReady(userId);
  if (!ready) return false;

  try {
    return await runWithOneSignal(async (OneSignal) => {
      const granted = await OneSignal.Notifications.requestPermission();
      return Boolean(granted);
    });
  } catch (err) {
    console.warn("[onesignal] requestPermission() failed:", err);
    return false;
  }
}

export async function oneSignalLogout(): Promise<void> {
  if (!initPromise || pushUnavailable) return;

  try {
    await runWithOneSignal((OneSignal) => {
      OneSignal.logout();
    });
  } catch {
    // best-effort on logout
  }
}
