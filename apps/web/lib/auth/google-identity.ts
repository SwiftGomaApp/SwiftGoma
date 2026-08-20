declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

let loadPromises: Partial<Record<string, Promise<void>>> = {};
let loadedLocale: string | null = null;

export function loadGoogleIdentity(locale: string = "en"): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Google Identity Services requires a browser environment."),
    );
  }

  // The script can only be loaded once per page — if it's already loaded
  // under a different locale, `hl` won't change until a full page reload.
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (loadPromises[locale]) return loadPromises[locale]!;

  loadPromises[locale] = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://accounts.google.com/gsi/client?hl=${locale}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      loadedLocale = locale;
      resolve();
    };
    script.onerror = () => {
      delete loadPromises[locale];
      reject(new Error("Failed to load Google Identity Services script."));
    };
    document.head.appendChild(script);
  });

  return loadPromises[locale]!;
}
