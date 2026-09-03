// Token storage for this template. A real mobile app would use secure
// device storage (Keychain/Keystore) instead of localStorage.
const ACCESS_TOKEN_KEY = "rider_access_token";
const REFRESH_TOKEN_KEY = "rider_refresh_token";

export type RiderUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isSignedIn(): boolean {
  return Boolean(getAccessToken());
}
