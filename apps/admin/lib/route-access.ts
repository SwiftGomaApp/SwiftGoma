import { ACCOUNT_NAV_ITEMS, NAV_GROUPS } from "@/lib/nav-config";
import type { AdminRole } from "@/lib/nav-config";

const STAFF_ROLES: AdminRole[] = ["ADMIN", "SUPPORT", "ACCOUNTANT"];

type RouteRule = { prefix: string; roles: AdminRole[] };

function collectRules(): RouteRule[] {
  const rules: RouteRule[] = [];

  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      rules.push({ prefix: item.href, roles: item.roles });
    }
  }

  for (const item of ACCOUNT_NAV_ITEMS) {
    rules.push({ prefix: item.href, roles: item.roles });
  }

  rules.push(
    { prefix: "/user/admin", roles: ["ADMIN"] },
    { prefix: "/user/support", roles: ["SUPPORT"] },
    { prefix: "/user/accountant", roles: ["ACCOUNTANT"] },
    { prefix: "/user", roles: STAFF_ROLES },
  );

  return rules.sort((a, b) => b.prefix.length - a.prefix.length);
}

const ROUTE_RULES = collectRules();

export function isStaffRole(role: string): role is AdminRole {
  return STAFF_ROLES.includes(role as AdminRole);
}

export function canAccessPath(pathname: string, role: string): boolean {
  if (!isStaffRole(role)) return false;
  if (pathname === "/") return true;

  const rule = ROUTE_RULES.find(
    (entry) =>
      pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`),
  );

  if (!rule) return false;
  return rule.roles.includes(role);
}
