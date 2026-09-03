import { apiDelete, apiPatch, apiPost } from "@/lib/api/client";
import type { AuthUser, LoginResult } from "@/lib/api/routes/auth.routes";

export const USER_ROUTES = {
  deleteAccount: "/users/delete",
  recoveryRequest: "/users/recovery/request",
  recoveryVerify: "/users/recovery/verify",
  updateProfile: "/users/profile",
  phoneRequest: "/users/phone/request",
  phoneVerify: "/users/phone/verify",
  phoneUpdateRequest: "/users/phone/update/request",
  phoneUpdateVerify: "/users/phone/update/verify",
  secondaryEmailRequest: "/users/email/secondary/request",
  secondaryEmailVerify: "/users/email/secondary/verify",
  secondaryEmail: "/users/email/secondary",
  linkGoogle: "/users/google/link",
  unlinkGoogle: "/users/google/unlink",
  linkApple: "/users/apple/link",
  unlinkApple: "/users/apple/unlink",
} as const;

export interface LinkAccountResult {
  message: string;
  googleLinked?: boolean;
  appleLinked?: boolean;
}

export interface DeleteAccountResult {
  message: string;
}

export function deleteAccount(params: {
  currentPassword?: string;
  reason?: string;
  locale?: string;
}) {
  return apiPost<DeleteAccountResult>(USER_ROUTES.deleteAccount, params);
}

export function requestAccountRecovery(body: {
  email: string;
  locale?: string;
}) {
  return apiPost<{ message: string }>(USER_ROUTES.recoveryRequest, body);
}

export function verifyAccountRecovery(body: {
  email: string;
  code: string;
  deviceName?: string;
  locale?: string;
}) {
  return apiPost<LoginResult>(USER_ROUTES.recoveryVerify, body);
}

export function updateProfile(body: {
  name?: string;
  preferredCurrency?: string;
}) {
  return apiPatch<AuthUser>(USER_ROUTES.updateProfile, body);
}

export interface OtpRequestResult {
  message: string;
}

// Initial phone verification — for accounts that don't have a verified
// phone number yet.
export function requestPhoneVerification(body: { phone: string }) {
  return apiPost<OtpRequestResult>(USER_ROUTES.phoneRequest, body);
}

export function verifyPhone(body: { code: string; locale?: string }) {
  return apiPost<AuthUser>(USER_ROUTES.phoneVerify, body);
}

// Phone update — for accounts that already have a verified phone number
// and want to change it.
export function requestPhoneUpdate(body: { newPhone: string }) {
  return apiPost<OtpRequestResult>(USER_ROUTES.phoneUpdateRequest, body);
}

export function verifyPhoneUpdate(body: { code: string; locale?: string }) {
  return apiPost<AuthUser>(USER_ROUTES.phoneUpdateVerify, body);
}

export function requestSecondaryEmail(body: {
  email: string;
  locale?: string;
}) {
  return apiPost<OtpRequestResult>(USER_ROUTES.secondaryEmailRequest, body);
}

export function verifySecondaryEmail(body: { code: string; locale?: string }) {
  return apiPost<AuthUser>(USER_ROUTES.secondaryEmailVerify, body);
}

export function deleteSecondaryEmail() {
  return apiDelete<AuthUser>(USER_ROUTES.secondaryEmail);
}

export function linkGoogleAccount(idToken: string) {
  return apiPost<LinkAccountResult>(USER_ROUTES.linkGoogle, { idToken });
}

export function unlinkGoogleAccount() {
  return apiPost<LinkAccountResult>(USER_ROUTES.unlinkGoogle);
}

export function linkAppleAccount(idToken: string) {
  return apiPost<LinkAccountResult>(USER_ROUTES.linkApple, { idToken });
}

export function unlinkAppleAccount() {
  return apiPost<LinkAccountResult>(USER_ROUTES.unlinkApple);
}
