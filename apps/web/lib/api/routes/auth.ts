import { api } from "../client";

export type UserEmail = {
  id: string;
  email: string;
  isVerified: boolean;
  isPrimary: boolean;
};

export type Passkey = {
  id: string;
  deviceName: string | null;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string | null;
  isEmailVerified: boolean;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  role: "BUYER";
  locale: string;
  emails: UserEmail[];
  passkeys: Passkey[];
  phone: string | null;
  isPhoneVerified: boolean;
  googleId: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type Session = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  deviceName: string | null;
  lastUsedAt: string;
  createdAt: string;
  isCurrent: boolean;
};

export type AuthResult = { user: User };
export type RequiresTotpResult = { requiresTotp: true; userId: string };

function unwrap<T>(promise: Promise<{ data: { data: T } }>) {
  return promise.then((res) => res.data.data);
}

export const authApi = {
  createAccount(input: {
    name: string;
    email: string;
    locale?: string;
    role?: "BUYER";
  }) {
    return unwrap<User>(api.post("/auth/create-account", input));
  },

  verifyEmail(input: { email: string; code: string }) {
    return unwrap<User>(api.post("/auth/verify-email", input));
  },

  resendEmailVerification(input: { email: string; locale?: string }) {
    return unwrap<User>(api.post("/auth/resend-verification", input));
  },

  loginWithPassword(input: {
    email: string;
    password: string;
    deviceName?: string;
    locale?: string;
  }) {
    return unwrap<AuthResult | RequiresTotpResult>(
      api.post("/auth/login/password", input),
    );
  },

  requestLoginOtp(input: { email: string; locale?: string }) {
    return unwrap<{ sent: boolean }>(
      api.post("/auth/login/request-otp", input),
    );
  },

  verifyLoginOtp(input: { email: string; code: string; deviceName?: string }) {
    return unwrap<AuthResult>(api.post("/auth/login/verify-otp", input));
  },

  loginWithTotp(input: {
    userId: string;
    code: string;
    deviceName?: string;
    locale?: string;
  }) {
    return unwrap<AuthResult>(api.post("/auth/login/totp", input));
  },

  registerWithGoogle(input: {
    idToken: string;
    role?: "BUYER";
    deviceName?: string;
    locale?: string;
  }) {
    return unwrap<AuthResult>(api.post("/auth/register/google", input));
  },

  loginWithGoogle(input: {
    idToken: string;
    deviceName?: string;
    locale?: string;
  }) {
    return unwrap<AuthResult | RequiresTotpResult>(
      api.post("/auth/login/google", input),
    );
  },

  generatePasskeyLoginOptions(input: { email?: string }) {
    return unwrap<
      PublicKeyCredentialRequestOptionsJSON & { challengeId?: string }
    >(api.post("/auth/passkey/login/options", input));
  },

  verifyPasskeyLogin(input: {
    email?: string;
    challengeId?: string;
    response: unknown;
    deviceName?: string;
    locale?: string;
  }) {
    return unwrap<AuthResult | RequiresTotpResult>(
      api.post("/auth/passkey/login/verify", input),
    );
  },

  forgotPassword(input: { email: string; locale?: string }) {
    return unwrap<{ sent: boolean }>(api.post("/auth/password/forgot", input));
  },

  resetPassword(input: {
    email: string;
    code: string;
    newPassword: string;
    locale?: string;
  }) {
    return unwrap<User>(api.post("/auth/password/reset", input));
  },

  getMe() {
    return unwrap<User>(api.get("/auth/me"));
  },

  logout() {
    return unwrap<{ success: boolean }>(api.post("/auth/logout"));
  },

  logoutAll() {
    return unwrap<{ success: boolean }>(api.post("/auth/logout-all"));
  },

  createPassword(input: { password: string }) {
    return unwrap<User>(api.post("/auth/password/create", input));
  },

  updatePassword(input: { currentPassword: string; newPassword: string }) {
    return unwrap<User>(api.post("/auth/password/update", input));
  },

  setupTotp() {
    return unwrap<{ qrCodeDataUrl: string; manualEntryKey: string }>(
      api.post("/auth/totp/setup"),
    );
  },

  confirmTotp(input: { code: string }) {
    return unwrap<{ backupCodes: string[] }>(
      api.post("/auth/totp/confirm", input),
    );
  },

  disableTotp(input: { code: string }) {
    return unwrap<{ message: string }>(api.post("/auth/totp/disable", input));
  },

  regenerateBackupCodes(input: { code: string }) {
    return unwrap<{ backupCodes: string[] }>(
      api.post("/auth/totp/regenerate-backup-codes", input),
    );
  },

  generatePasskeyRegistrationOptions() {
    return unwrap<Record<string, unknown>>(
      api.post("/auth/passkey/register/options"),
    );
  },

  verifyPasskeyRegistration(input: { response: unknown; deviceName?: string }) {
    return unwrap<Passkey>(api.post("/auth/passkey/register/verify", input));
  },

  deletePasskey(passkeyId: string) {
    return unwrap<{ id: string; deleted: boolean }>(
      api.delete(`/auth/passkey/${passkeyId}`),
    );
  },

  listSessions() {
    return unwrap<Session[]>(api.get("/auth/sessions"));
  },

  revokeSession(sessionId: string) {
    return unwrap<{ id: string; revoked: boolean }>(
      api.delete(`/auth/sessions/${sessionId}`),
    );
  },

  listPasskeys() {
    return unwrap<Passkey[]>(api.get("/auth/passkey"));
  },
};

type PublicKeyCredentialRequestOptionsJSON = Record<string, unknown>;
