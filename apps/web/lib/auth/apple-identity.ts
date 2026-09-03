declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope?: string;
          redirectURI: string;
          usePopup?: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: { id_token: string; code: string; state?: string };
        }>;
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;

export function loadAppleIdentity(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Sign in with Apple requires a browser environment."),
    );
  }

  if (window.AppleID?.auth) {
    return Promise.resolve();
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Sign in with Apple JS."));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
