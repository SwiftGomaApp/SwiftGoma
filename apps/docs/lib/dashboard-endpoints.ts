import type { EndpointDoc } from "@/lib/types";

const BASE = "/api/v1/dashboard";

export const DASHBOARD_GROUPS = ["Dashboard"] as const;

export const dashboardEndpoints: EndpointDoc[] = [
  {
    slug: "get-support-overview",
    method: "GET",
    path: `${BASE}/support-overview`,
    title: "Get support overview",
    group: "Dashboard",
    auth: "bearer",
    roles: ["ADMIN", "SUPPORT"],
    rateLimit: "Session",
    description: "Snapshot for the support team's dashboard — open contact messages, pending KYC reviews, and recent moderation activity.",
    successStatus: 200,
    responseExample: {
      success: true,
      data: { openContactMessages: 6, pendingKyc: 3, blockedUsers: 2, incidentsInProgress: 1 },
    },
  },
  {
    slug: "get-support-metrics",
    method: "GET",
    path: `${BASE}/support-metrics`,
    title: "Get support metrics",
    group: "Dashboard",
    auth: "bearer",
    roles: ["ADMIN", "SUPPORT"],
    rateLimit: "Session",
    description: "Time-series support metrics, e.g. contact messages and KYC reviews per day.",
    queryParams: [{ name: "days", type: "number", required: false, description: "Window size in days. Defaults to 30." }],
    successStatus: 200,
    responseExample: {
      success: true,
      data: { series: [{ date: "2026-02-14", contactMessages: 4, kycReviewed: 2 }] },
    },
  },
  {
    slug: "get-accountant-overview",
    method: "GET",
    path: `${BASE}/accountant-overview`,
    title: "Get accountant overview",
    group: "Dashboard",
    auth: "bearer",
    roles: ["ADMIN", "ACCOUNTANT"],
    rateLimit: "Session",
    description: "Snapshot for the finance team's dashboard — pending expense approvals, subscription revenue, and payout activity.",
    successStatus: 200,
    responseExample: {
      success: true,
      data: { pendingExpenseApprovals: 2, subscriptionRevenue: [{ currency: "USD", amount: "1280.00" }], payoutsToday: 5 },
    },
  },
  {
    slug: "get-admin-overview",
    method: "GET",
    path: `${BASE}/overview`,
    title: "Get admin overview",
    group: "Dashboard",
    auth: "bearer",
    roles: ["ADMIN"],
    rateLimit: "Session",
    description: "Platform-wide snapshot — users, sellers, orders, and GMV at a glance. Admin-only.",
    successStatus: 200,
    responseExample: {
      success: true,
      data: { totalUsers: 4820, totalSellers: 210, totalOrders: 12400, gmv: [{ currency: "USD", amount: "184200.00" }] },
    },
  },
  {
    slug: "get-admin-metrics",
    method: "GET",
    path: `${BASE}/metrics`,
    title: "Get admin metrics",
    group: "Dashboard",
    auth: "bearer",
    roles: ["ADMIN"],
    rateLimit: "Session",
    description: "Time-series platform metrics — signups, orders, and revenue over a configurable window. Admin-only.",
    queryParams: [
      { name: "days", type: "number", required: false, description: "Window size in days. Defaults to 30." },
      { name: "currency", type: "string", required: false, description: "USD or CDF — for revenue figures." },
    ],
    successStatus: 200,
    responseExample: {
      success: true,
      data: { series: [{ date: "2026-02-14", newUsers: 18, orders: 62, revenue: "940.00" }] },
    },
  },
];
