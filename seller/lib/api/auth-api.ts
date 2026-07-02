import { apiClient, type ApiSuccessResponse } from "@/lib/api-client";

export interface RegisterPayload {
  name: string;
  identifier: string;
  role: "SELLER" | "BUYER";
}

export interface RegisterResponseData {
  userId: string;
  type: "email" | "phone";
  target: string;
}

export interface VerifyAccountPayload {
  userId: string;
  code: string;
}

export interface VerifyAccountResponseData {
  userId: string;
  name: string;
}

export interface ResendOtpPayload {
  userId: string;
  type:
    | "ACCOUNT_VERIFICATION"
    | "SIGNIN"
    | "RESET_PASSWORD"
    | "DISABLE_2FA"
    | "REGENERATE_BACKUP_CODES";
}

export interface ResendOtpResponseData {
  target: string;
  type: "email" | "phone";
}

export interface LoginWithOtpPayload {
  identifier: string;
}

export interface LoginWithOtpResponseData {
  userId: string;
  type: "email" | "phone";
  target: string;
}

export interface VerifyLoginOtpPayload {
  userId: string;
  code: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

export type VerifyLoginOtpResponseData =
  | { requires2fa: true; userId: string }
  | { user: AuthUser };

export interface LoginWithPasswordPayload {
  identifier: string;
  password: string;
}

export type LoginWithPasswordResponseData =
  | { requires2fa: true; userId: string }
  | { user: AuthUser };

export interface ForgotPasswordPayload {
  identifier: string;
}

export interface ForgotPasswordResponseData {
  userId: string | null;
  target: string;
  type: "email" | "phone";
}

export interface ResetPasswordPayload {
  userId: string;
  code: string;
  newPassword: string;
}

export interface CreatePasswordPayload {
  password: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface MeResponseData extends AuthUser {
  isVerified: boolean;
  hasPassword: boolean;
  passwordChangedAt: string | null;
  currentSessionId: string;
}

export interface SetupTotpResponseData {
  secret: string;
  qrCodeUrl: string;
}

export interface EnableTotpPayload {
  code: string;
}

export interface EnableTotpResponseData {
  backupCodes: string[];
}

export interface VerifyTotpLoginPayload {
  userId: string;
  code: string;
}

export interface VerifyTotpLoginResponseData {
  usedBackupCode: boolean;
}

export interface DisableTotpPayload {
  totpCode?: string;
  otpCode?: string;
}

export interface RegenerateBackupCodesPayload {
  totpCode?: string;
  otpCode?: string;
}

export interface RegenerateBackupCodesResponseData {
  backupCodes: string[];
}

export interface RequestSecurityActionResponseData {
  type: "email" | "phone";
  target: string;
}

export interface GoogleAuthPayload {
  idToken: string;
}

export interface GoogleRegisterPayload extends GoogleAuthPayload {
  role: "SELLER" | "BUYER";
}

export interface GoogleAuthResponseData {
  user: AuthUser;
}

export interface PasskeyAuthOptionsResponseData {
  [key: string]: unknown;
}

export interface PasskeyAuthVerifyPayload {
  credential: unknown;
}

export interface PasskeyRegistrationOptionsResponseData {
  [key: string]: unknown;
}

export interface PasskeyRegistrationVerifyPayload {
  credential: unknown;
  name?: string;
}

export interface Passkey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}


export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient
      .post<ApiSuccessResponse<RegisterResponseData>>("/auth/register", payload)
      .then((res) => res.data),

  verifyAccount: (payload: VerifyAccountPayload) =>
    apiClient
      .post<
        ApiSuccessResponse<VerifyAccountResponseData>
      >("/auth/verify-account", payload)
      .then((res) => res.data),

  resendOtp: (payload: ResendOtpPayload) =>
    apiClient
      .post<
        ApiSuccessResponse<ResendOtpResponseData>
      >("/auth/resend-otp", payload)
      .then((res) => res.data),

  loginWithOtp: (payload: LoginWithOtpPayload) =>
    apiClient
      .post<
        ApiSuccessResponse<LoginWithOtpResponseData>
      >("/auth/login/otp", payload)
      .then((res) => res.data),

  verifyLoginOtp: (payload: VerifyLoginOtpPayload) =>
    apiClient
      .post<
        ApiSuccessResponse<VerifyLoginOtpResponseData>
      >("/auth/login/otp/verify", payload)
      .then((res) => res.data),

  loginWithPassword: (payload: LoginWithPasswordPayload) =>
    apiClient
      .post<
        ApiSuccessResponse<LoginWithPasswordResponseData>
      >("/auth/login/password", payload)
      .then((res) => res.data),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiClient
      .post<
        ApiSuccessResponse<ForgotPasswordResponseData>
      >("/auth/password/forgot", payload)
      .then((res) => res.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient
      .post<ApiSuccessResponse<null>>("/auth/password/reset", payload)
      .then((res) => res.data),

  createPassword: (payload: CreatePasswordPayload) =>
    apiClient
      .post<ApiSuccessResponse<null>>("/auth/password/create", payload)
      .then((res) => res.data),

  updatePassword: (payload: UpdatePasswordPayload) =>
    apiClient
      .patch<ApiSuccessResponse<null>>("/auth/password/update", payload)
      .then((res) => res.data),

  getMe: () =>
    apiClient
      .get<ApiSuccessResponse<MeResponseData>>("/auth/me")
      .then((res) => res.data),

  logout: () =>
    apiClient
      .post<ApiSuccessResponse<null>>("/auth/logout")
      .then((res) => res.data),

  logoutAll: () =>
    apiClient
      .post<ApiSuccessResponse<null>>("/auth/logout/all")
      .then((res) => res.data),
};

// ─── TOTP API ───────────────────────────────────────────────────────────────

export const totpApi = {
  setup: () =>
    apiClient
      .post<ApiSuccessResponse<SetupTotpResponseData>>("/auth/totp/setup")
      .then((res) => res.data),

  enable: (payload: EnableTotpPayload) =>
    apiClient
      .post<
        ApiSuccessResponse<EnableTotpResponseData>
      >("/auth/totp/enable", payload)
      .then((res) => res.data),

  verifyLogin: (payload: VerifyTotpLoginPayload) =>
    apiClient
      .post<
        ApiSuccessResponse<VerifyTotpLoginResponseData>
      >("/auth/totp/verify", payload)
      .then((res) => res.data),

  requestDisable: () =>
    apiClient
      .post<
        ApiSuccessResponse<RequestSecurityActionResponseData>
      >("/auth/totp/disable/request")
      .then((res) => res.data),

  disable: (payload: DisableTotpPayload) =>
    apiClient
      .post<ApiSuccessResponse<null>>("/auth/totp/disable", payload)
      .then((res) => res.data),

  requestRegenerateBackupCodes: () =>
    apiClient
      .post<
        ApiSuccessResponse<RequestSecurityActionResponseData>
      >("/auth/totp/backup-codes/request")
      .then((res) => res.data),

  regenerateBackupCodes: (payload: RegenerateBackupCodesPayload) =>
    apiClient
      .post<
        ApiSuccessResponse<RegenerateBackupCodesResponseData>
      >("/auth/totp/backup-codes/regenerate", payload)
      .then((res) => res.data),
};

// ─── Google OAuth API ───────────────────────────────────────────────────────

export const googleApi = {
  register: (payload: GoogleRegisterPayload) =>
    apiClient
      .post<
        ApiSuccessResponse<GoogleAuthResponseData>
      >("/auth/google/register", payload)
      .then((res) => res.data),

  login: (payload: GoogleAuthPayload) =>
    apiClient
      .post<
        ApiSuccessResponse<GoogleAuthResponseData>
      >("/auth/google/login", payload)
      .then((res) => res.data),

  link: (payload: GoogleAuthPayload) =>
    apiClient
      .post<ApiSuccessResponse<null>>("/auth/google/link", payload)
      .then((res) => res.data),

  unlink: () =>
    apiClient
      .delete<ApiSuccessResponse<null>>("/auth/google/link")
      .then((res) => res.data),

  requestUnlink: () =>
    apiClient
      .post<
        ApiSuccessResponse<RequestSecurityActionResponseData>
      >("/auth/google/unlink/request")
      .then((res) => res.data),

  verifyUnlink: (payload: { code: string }) =>
    apiClient
      .post<ApiSuccessResponse<null>>("/auth/google/unlink/verify", payload)
      .then((res) => res.data),
};

// ─── Passkey API ────────────────────────────────────────────────────────────

export const passkeyApi = {
  // Unauthenticated — login via passkey
  getAuthOptions: () =>
    apiClient
      .get<
        ApiSuccessResponse<PasskeyAuthOptionsResponseData>
      >("/auth/passkeys/auth/options")
      .then((res) => res.data),

  verifyAuth: (payload: PasskeyAuthVerifyPayload) =>
    apiClient
      .post<ApiSuccessResponse<null>>("/auth/passkeys/auth/verify", payload)
      .then((res) => res.data),

  list: () =>
    apiClient
      .get<ApiSuccessResponse<Passkey[]>>("/auth/passkeys")
      .then((res) => res.data),

  getRegistrationOptions: () =>
    apiClient
      .get<
        ApiSuccessResponse<PasskeyRegistrationOptionsResponseData>
      >("/auth/passkeys/register/options")
      .then((res) => res.data),

  verifyRegistration: (payload: PasskeyRegistrationVerifyPayload) =>
    apiClient
      .post<ApiSuccessResponse<null>>("/auth/passkeys/register/verify", payload)
      .then((res) => res.data),

  requestRemove: (passkeyId: string) =>
    apiClient
      .post<
        ApiSuccessResponse<RequestSecurityActionResponseData>
      >(`/auth/passkeys/${passkeyId}/remove/request`)
      .then((res) => res.data),

  remove: (passkeyId: string, code: string) =>
    apiClient
      .delete<ApiSuccessResponse<null>>(`/auth/passkeys/${passkeyId}`, {
        data: { code },
      })
      .then((res) => res.data),
};
