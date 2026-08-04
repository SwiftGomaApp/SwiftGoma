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

let loadPromise: Promise<void> | null = null;

export function loadGoogleIdentity(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Google Identity Services requires a browser environment."),
    );
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Google Identity Services script."));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
