import { apiPost } from "@/lib/api/client";
import type { LoginResult } from "@/lib/api/routes/auth.routes";

export const USER_ROUTES = {
  deleteAccount: "/users/delete",
  recoveryRequest: "/users/recovery/request",
  recoveryVerify: "/users/recovery/verify",
} as const;

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
