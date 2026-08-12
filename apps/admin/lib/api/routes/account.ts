import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";
import type { AuthUser } from "@/types/auth";

export async function linkGoogleAccount(idToken: string): Promise<AuthUser> {
  const res = await apiClient.post("/users/google/link", { idToken });
  return unwrap(res);
}

export async function unlinkGoogleAccount(): Promise<AuthUser> {
  const res = await apiClient.post("/users/google/unlink");
  return unwrap(res);
}
