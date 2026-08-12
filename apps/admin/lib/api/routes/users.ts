import { apiClient } from "@/lib/api/client";
import { unwrap, toQueryString, type Paginated } from "@/lib/api/utils";

export type UserRole = "BUYER" | "SELLER" | "RIDER" | "ADMIN" | "SUPPORT" | "ACCOUNTANT";

export type SellerProfileStatus = "DRAFT" | "ACTIVE" | "SUSPENDED";

export interface UserEmail {
  id: string;
  email: string;
  isPrimary: boolean;
  isVerified: boolean;
}

export interface UserListItem {
  id: string;
  name: string;
  email: string | null;
  isEmailVerified: boolean;
  emails: UserEmail[];
  phone: string | null;
  isPhoneVerified: boolean;
  role: UserRole;
  isBlocked: boolean;
  deletedAt: string | null;
  createdAt: string;
  sellerProfile?: {
    status: SellerProfileStatus;
    businessName: string;
  } | null;
}

export interface UserListResponse extends Paginated {
  users: UserListItem[];
}

export interface UserSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  deviceName: string | null;
  isRevoked: boolean;
  lastUsedAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface UserActionLogEntry {
  id: string;
  action: string;
  reason: string | null;
  actorId: string;
  actorRole: string;
  metadata: unknown;
  createdAt: string;
}

export interface UserDetail extends UserListItem {
  sessions: UserSession[];
  actionsReceived: UserActionLogEntry[];
}

export async function listUsers(
  params: {
    page?: number;
    limit?: number;
    role?: UserRole;
    status?: string;
    search?: string;
  } = {},
): Promise<UserListResponse> {
  const res = await apiClient.get(`/users${toQueryString(params)}`);
  return unwrap(res);
}

export async function getUser(id: string): Promise<UserDetail> {
  const res = await apiClient.get(`/users/${id}`);
  return unwrap(res);
}

export async function blockUser(
  id: string,
  reason?: string,
): Promise<UserDetail> {
  const res = await apiClient.post(`/users/${id}/block`, { reason });
  return unwrap(res);
}

export async function unblockUser(
  id: string,
  reason?: string,
): Promise<UserDetail> {
  const res = await apiClient.post(`/users/${id}/unblock`, { reason });
  return unwrap(res);
}

export async function forceLogoutUser(
  id: string,
  options: { sessionId?: string; reason?: string } = {},
): Promise<{ message: string }> {
  const res = await apiClient.post(`/users/${id}/force-logout`, options);
  return unwrap(res);
}

export async function verifyUserEmail(
  id: string,
  emailId: string,
): Promise<{ email: string; isPrimary: boolean; isVerified: true }> {
  const res = await apiClient.post(`/users/${id}/verify-email`, { emailId });
  return unwrap(res);
}

export async function verifyUserPhone(id: string): Promise<UserDetail> {
  const res = await apiClient.post(`/users/${id}/verify-phone`);
  return unwrap(res);
}

export async function deleteUser(
  id: string,
  reason?: string,
): Promise<{ message: string }> {
  const res = await apiClient.post(`/users/${id}/delete`, { reason });
  return unwrap(res);
}

export async function restoreUser(
  id: string,
  reason?: string,
): Promise<{ message: string }> {
  const res = await apiClient.post(`/users/${id}/restore`, { reason });
  return unwrap(res);
}

export async function changeUserRole(
  id: string,
  role: UserRole,
  reason?: string,
): Promise<UserDetail> {
  const res = await apiClient.post(`/users/${id}/role`, { role, reason });
  return unwrap(res);
}
