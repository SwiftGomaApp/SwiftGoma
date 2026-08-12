import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";
import type { AuthUser } from "@/types/auth";

export type Locale = "en" | "fr";

export interface RequestLoginOtpPayload {
  email: string;
}

export async function requestLoginOtp(payload: RequestLoginOtpPayload) {
  const res = await apiClient.post("/auth/login/request-otp", payload);
  return unwrap(res);
}

export interface VerifyLoginOtpPayload {
  email: string;
  code: string;
}

export async function verifyLoginOtp(payload: VerifyLoginOtpPayload) {
  const res = await apiClient.post("/auth/login/verify-otp", payload);
  return unwrap(res);
}

export interface LoginWithPasswordPayload {
  email: string;
  password: string;
}

export interface AuthSession {
  user: unknown;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface RequiresTotp {
  requiresTotp: true;
  pendingToken: string;
}

export type LoginWithPasswordResponse = AuthSession | RequiresTotp;

export function isRequiresTotp(
  res: LoginWithPasswordResponse,
): res is RequiresTotp {
  return "requiresTotp" in res && res.requiresTotp === true;
}

export async function loginWithPassword(
  payload: LoginWithPasswordPayload,
): Promise<LoginWithPasswordResponse> {
  const res = await apiClient.post("/auth/login/password", payload);
  return unwrap<LoginWithPasswordResponse>(res);
}

export interface VerifyLoginTotpPayload {
  pendingToken: string;
  code: string;
}

export async function verifyLoginTotp(payload: VerifyLoginTotpPayload) {
  const res = await apiClient.post("/auth/login/totp", payload);
  return unwrap<AuthSession>(res);
}

export interface ForgotPasswordPayload {
  email: string;
  locale?: Locale;
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  const res = await apiClient.post("/auth/password/forgot", payload);
  return unwrap<{ message: string }>(res);
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
  locale?: Locale;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const res = await apiClient.post("/auth/password/reset", payload);
  return unwrap(res);
}

export async function getMe() {
  const res = await apiClient.get("/auth/me");
  return unwrap(res);
}

export function userFromLoginData(data: unknown): AuthUser | null {
  if (!data || typeof data !== "object" || !("user" in data)) return null;
  const user = (data as { user: unknown }).user;
  if (!user || typeof user !== "object") return null;
  return user as AuthUser;
}

export async function logout() {
  const res = await apiClient.post("/auth/logout");
  return unwrap(res);
}

export async function logoutAll() {
  const res = await apiClient.post("/auth/logout-all");
  return unwrap(res);
}

export interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  deviceName: string | null;
  lastUsedAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export async function listSessions(): Promise<Session[]> {
  const res = await apiClient.get("/auth/sessions");
  return unwrap(res);
}

export async function revokeSession(
  sessionId: string,
): Promise<{ id: string; revoked: boolean }> {
  const res = await apiClient.delete(`/auth/sessions/${sessionId}`);
  return unwrap(res);
}

export async function updatePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  const res = await apiClient.post("/auth/password/update", payload);
  return unwrap(res);
}

export interface SetupTotpResponse {
  qrCodeDataUrl: string;
  manualEntryKey: string;
}

export async function setupTotp(): Promise<SetupTotpResponse> {
  const res = await apiClient.post("/auth/totp/setup");
  return unwrap(res);
}

export async function confirmTotp(
  code: string,
): Promise<{ backupCodes: string[] }> {
  const res = await apiClient.post("/auth/totp/confirm", { code });
  return unwrap(res);
}

export async function disableTotp(code: string): Promise<{ message: string }> {
  const res = await apiClient.post("/auth/totp/disable", { code });
  return unwrap(res);
}

export async function regenerateBackupCodes(
  code: string,
): Promise<{ backupCodes: string[] }> {
  const res = await apiClient.post("/auth/totp/regenerate-backup-codes", {
    code,
  });
  return unwrap(res);
}

export async function loginWithGoogle(input: {
  idToken: string;
  deviceName?: string;
}): Promise<LoginWithPasswordResponse> {
  const res = await apiClient.post("/auth/login/google", input);
  return unwrap<LoginWithPasswordResponse>(res);
}

export type Passkey = {
  id: string;
  deviceName: string | null;
  createdAt: string;
};

export async function generatePasskeyLoginOptions(input: { email?: string }) {
  const res = await apiClient.post("/auth/passkey/login/options", input);
  return unwrap<
    PublicKeyCredentialRequestOptionsJSON & { challengeId?: string }
  >(res);
}

export async function verifyPasskeyLogin(input: {
  email?: string;
  challengeId?: string;
  response: unknown;
  deviceName?: string;
}): Promise<LoginWithPasswordResponse> {
  const res = await apiClient.post("/auth/passkey/login/verify", input);
  return unwrap<LoginWithPasswordResponse>(res);
}

export async function generatePasskeyRegistrationOptions() {
  const res = await apiClient.post("/auth/passkey/register/options");
  return unwrap<Record<string, unknown>>(res);
}

export async function verifyPasskeyRegistration(input: {
  response: unknown;
  deviceName?: string;
}) {
  const res = await apiClient.post("/auth/passkey/register/verify", input);
  return unwrap<Passkey>(res);
}

export async function deletePasskey(
  passkeyId: string,
): Promise<{ id: string; deleted: boolean }> {
  const res = await apiClient.delete(`/auth/passkey/${passkeyId}`);
  return unwrap(res);
}

export async function listPasskeys(): Promise<Passkey[]> {
  const res = await apiClient.get("/auth/passkey");
  return unwrap(res);
}

type PublicKeyCredentialRequestOptionsJSON = Record<string, unknown>;
