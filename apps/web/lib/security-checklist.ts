import type { AuthUser } from "./api/routes/auth.routes";

export type SecurityChecklistItemId =
  | "twoFactor"
  | "passkey"
  | "password"
  | "secondaryEmail";

const DISMISS_STORAGE_KEY = "swg:security-checklist-dismissed-until";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hasPasskey(user: AuthUser): boolean {
  return (user.passkeys?.length ?? 0) > 0;
}

export function hasTwoFactor(user: AuthUser): boolean {
  return Boolean(user.twoFactorEnabled);
}

export function hasSecondaryEmail(user: AuthUser): boolean {
  return (user.emails?.length ?? 0) > 1;
}

export function isSecurityBarMet(user: AuthUser): boolean {
  return hasPasskey(user) || hasTwoFactor(user);
}

export function getSecurityChecklistStatus(
  user: AuthUser,
): Record<SecurityChecklistItemId, boolean> {
  return {
    twoFactor: hasTwoFactor(user),
    passkey: hasPasskey(user),
    password: Boolean(user.hasPassword),
    secondaryEmail: hasSecondaryEmail(user),
  };
}

export function isSecurityChecklistDismissed(): boolean {
  try {
    const until = Number(localStorage.getItem(DISMISS_STORAGE_KEY));
    return Boolean(until) && Date.now() < until;
  } catch {
    return false;
  }
}

export function dismissSecurityChecklist(): void {
  try {
    localStorage.setItem(
      DISMISS_STORAGE_KEY,
      String(Date.now() + DISMISS_COOLDOWN_MS),
    );
  } catch {
    // Private browsing / storage disabled — worst case it re-prompts more often.
  }
}
