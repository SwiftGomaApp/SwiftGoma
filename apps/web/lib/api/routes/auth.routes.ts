import { apiGet, apiPost, apiDelete } from "@/lib/api/client";

export const AUTH_ROUTES = {
  createAccount: "/auth/create-account",
  verifyEmail: "/auth/verify-email",
  registerWithGoogle: "/auth/register/google",
  loginWithGoogle: "/auth/login/google",

  resendVerification: "/auth/resend-verification",
  requestLoginOtp: "/auth/login/request-otp",
  passkeyLoginOptions: "/auth/passkey/login/options",
  forgotPassword: "/auth/password/forgot",

  verifyLoginOtp: "/auth/login/verify-otp",
  loginWithPassword: "/auth/login/password",
  loginWithTotp: "/auth/login/totp",
  verifyPasskeyLogin: "/auth/passkey/login/verify",
  resetPassword: "/auth/password/reset",
  updatePassword: "/auth/password/update",
  confirmTotp: "/auth/totp/confirm",
  disableTotp: "/auth/totp/disable",

  refreshToken: "/auth/refresh-token",
  me: "/auth/me",
  logout: "/auth/logout",
  logoutAll: "/auth/logout-all",
  sessions: "/auth/sessions",
  revokeSession: (sessionId: string) => `/auth/sessions/${sessionId}`,

  createPassword: "/auth/password/create",
  setupTotp: "/auth/totp/setup",
  regenerateBackupCodes: "/auth/totp/regenerate-backup-codes",
  passkeyRegisterOptions: "/auth/passkey/register/options",
  passkeyRegisterVerify: "/auth/passkey/register/verify",
  passkeys: "/auth/passkey",
  deletePasskey: (passkeyId: string) => `/auth/passkey/${passkeyId}`,
} as const;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

export interface MobileAuthPayload {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface WebAuthPayload {
  user: AuthUser;
}

export interface TotpRequiredPayload {
  requiresTotp: true;
  pendingToken: string;
}

export interface SessionSummary {
  id: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  isCurrent: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface Passkey {
  id: string;
  deviceName: string | null;
  createdAt: string;
}

type LoginResult = WebAuthPayload | MobileAuthPayload | TotpRequiredPayload;

export function createAccount(body: {
  name: string;
  email: string;
  locale?: string;
  role?: string;
}) {
  return apiPost<AuthUser>(AUTH_ROUTES.createAccount, body);
}

export function verifyEmail(body: { email: string; code: string }) {
  return apiPost<AuthUser>(AUTH_ROUTES.verifyEmail, body);
}

export function registerWithGoogle(body: { idToken: string; locale?: string }) {
  return apiPost<WebAuthPayload | MobileAuthPayload>(
    AUTH_ROUTES.registerWithGoogle,
    body,
  );
}

export function loginWithGoogle(body: { idToken: string }) {
  return apiPost<WebAuthPayload | MobileAuthPayload>(
    AUTH_ROUTES.loginWithGoogle,
    body,
  );
}

export function resendEmailVerification(body: {
  email: string;
  locale?: string;
}) {
  return apiPost(AUTH_ROUTES.resendVerification, body);
}

export function requestLoginOtp(body: { email: string; locale?: string }) {
  return apiPost(AUTH_ROUTES.requestLoginOtp, body);
}

export function generatePasskeyLoginOptions(body: { email?: string }) {
  return apiPost(AUTH_ROUTES.passkeyLoginOptions, body);
}

export function forgotPassword(body: { email: string; locale?: string }) {
  return apiPost(AUTH_ROUTES.forgotPassword, body);
}

export function verifyLoginOtp(body: {
  email: string;
  code: string;
  deviceName?: string;
}) {
  return apiPost<LoginResult>(AUTH_ROUTES.verifyLoginOtp, body);
}

export function loginWithPassword(body: {
  email: string;
  password: string;
  deviceName?: string;
  locale?: string;
}) {
  return apiPost<LoginResult>(AUTH_ROUTES.loginWithPassword, body);
}

export function loginWithTotp(body: { pendingToken: string; code: string }) {
  return apiPost<LoginResult>(AUTH_ROUTES.loginWithTotp, body);
}

export function verifyPasskeyLogin(body: { credential: unknown }) {
  return apiPost<LoginResult>(AUTH_ROUTES.verifyPasskeyLogin, body);
}

export function resetPassword(body: {
  email: string;
  code: string;
  newPassword: string;
}) {
  return apiPost(AUTH_ROUTES.resetPassword, body);
}

export function updatePassword(body: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiPost(AUTH_ROUTES.updatePassword, body);
}

export function confirmTotp(body: { code: string }) {
  return apiPost(AUTH_ROUTES.confirmTotp, body);
}

export function disableTotp(body: { code: string }) {
  return apiPost(AUTH_ROUTES.disableTotp, body);
}

export function refreshAccessToken() {
  return apiPost<WebAuthPayload | MobileAuthPayload>(AUTH_ROUTES.refreshToken);
}

export function getMe() {
  return apiGet<AuthUser>(AUTH_ROUTES.me);
}

export function logout() {
  return apiPost(AUTH_ROUTES.logout);
}

export function logoutAll() {
  return apiPost(AUTH_ROUTES.logoutAll);
}

export function listSessions() {
  return apiGet<SessionSummary[]>(AUTH_ROUTES.sessions);
}

export function revokeSession(sessionId: string) {
  return apiDelete(AUTH_ROUTES.revokeSession(sessionId));
}

export function createPassword(body: { password: string }) {
  return apiPost(AUTH_ROUTES.createPassword, body);
}

export function setupTotp() {
  return apiPost<{ secret: string; otpauthUrl: string }>(AUTH_ROUTES.setupTotp);
}

export function regenerateBackupCodes() {
  return apiPost<{ backupCodes: string[] }>(AUTH_ROUTES.regenerateBackupCodes);
}

export function generatePasskeyRegistrationOptions() {
  return apiPost(AUTH_ROUTES.passkeyRegisterOptions);
}

export function verifyPasskeyRegistration(body: {
  credential: unknown;
  deviceName?: string;
}) {
  return apiPost(AUTH_ROUTES.passkeyRegisterVerify, body);
}

export function listPasskeys() {
  return apiGet<Passkey[]>(AUTH_ROUTES.passkeys);
}

export function deletePasskey(passkeyId: string) {
  return apiDelete(AUTH_ROUTES.deletePasskey(passkeyId));
}