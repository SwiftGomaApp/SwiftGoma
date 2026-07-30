import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";

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
  userId: string;
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
  userId: string;
  code: string;
}

export async function verifyLoginTotp(payload: VerifyLoginTotpPayload) {
  const res = await apiClient.post("/auth/login/verify-totp", payload);
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

export async function logout() {
  const res = await apiClient.post("/auth/logout");
  return unwrap(res);
}
