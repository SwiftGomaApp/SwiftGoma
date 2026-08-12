import type { AuthUser } from "@/types/auth";

export function getDashboardPath(role: AuthUser["role"] | string): string {
  if (role === "SUPPORT") return "/user/support";
  if (role === "ACCOUNTANT") return "/user/accountant";
  return "/user/admin";
}
