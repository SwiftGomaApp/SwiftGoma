import { groupBy } from "@/lib/types";
import { authEndpoints, AUTH_GROUPS } from "@/lib/auth-endpoints";
import { userEndpoints, USER_GROUPS } from "@/lib/user-endpoints";
import { productEndpoints, PRODUCT_GROUPS } from "@/lib/product-endpoints";
import { orderEndpoints, ORDER_GROUPS } from "@/lib/order-endpoints";
import { sellerProfileEndpoints, SELLER_PROFILE_GROUPS } from "@/lib/seller-profile-endpoints";
import { kycEndpoints, KYC_GROUPS } from "@/lib/kyc-endpoints";
import { paymentsEndpoints, PAYMENTS_GROUPS } from "@/lib/payments-endpoints";
import { mbiyopayEndpoints, MBIYOPAY_GROUPS } from "@/lib/mbiyopay-endpoints";
import { notificationEndpoints, NOTIFICATION_GROUPS } from "@/lib/notification-endpoints";
import { shopEndpoints, SHOP_GROUPS } from "@/lib/shop-endpoints";
import { riderEndpoints, RIDER_GROUPS } from "@/lib/rider-endpoints";
import { billingEndpoints, BILLING_GROUPS } from "@/lib/billing-endpoints";
import { dashboardEndpoints, DASHBOARD_GROUPS } from "@/lib/dashboard-endpoints";
import { walletEndpoints, WALLET_GROUPS } from "@/lib/wallet-endpoints";
import { favoriteEndpoints, FAVORITE_GROUPS } from "@/lib/favorite-endpoints";
import { supportEndpoints, SUPPORT_GROUPS } from "@/lib/support-endpoints";
import { incidentEndpoints, INCIDENT_GROUPS } from "@/lib/incident-endpoints";
import { blogEndpoints, BLOG_GROUPS } from "@/lib/blog-endpoints";
import { accountingEndpoints, ACCOUNTING_GROUPS } from "@/lib/accounting-endpoints";
import { expenseEndpoints, EXPENSE_GROUPS } from "@/lib/expense-endpoints";
import { storefrontEndpoints, STOREFRONT_GROUPS } from "@/lib/storefront-endpoints";

export const allEndpoints = [
  ...authEndpoints,
  ...userEndpoints,
  ...productEndpoints,
  ...orderEndpoints,
  ...sellerProfileEndpoints,
  ...kycEndpoints,
  ...paymentsEndpoints,
  ...mbiyopayEndpoints,
  ...notificationEndpoints,
  ...shopEndpoints,
  ...riderEndpoints,
  ...billingEndpoints,
  ...dashboardEndpoints,
  ...walletEndpoints,
  ...favoriteEndpoints,
  ...supportEndpoints,
  ...incidentEndpoints,
  ...blogEndpoints,
  ...accountingEndpoints,
  ...expenseEndpoints,
  ...storefrontEndpoints,
];

export const ALL_GROUPS = [
  ...AUTH_GROUPS,
  ...USER_GROUPS,
  ...PRODUCT_GROUPS,
  ...ORDER_GROUPS,
  ...SELLER_PROFILE_GROUPS,
  ...KYC_GROUPS,
  ...PAYMENTS_GROUPS,
  ...MBIYOPAY_GROUPS,
  ...NOTIFICATION_GROUPS,
  ...SHOP_GROUPS,
  ...RIDER_GROUPS,
  ...BILLING_GROUPS,
  ...DASHBOARD_GROUPS,
  ...WALLET_GROUPS,
  ...FAVORITE_GROUPS,
  ...SUPPORT_GROUPS,
  ...INCIDENT_GROUPS,
  ...BLOG_GROUPS,
  ...ACCOUNTING_GROUPS,
  ...EXPENSE_GROUPS,
  ...STOREFRONT_GROUPS,
] as const;

export function getEndpointBySlug(slug: string) {
  return allEndpoints.find((e) => e.slug === slug);
}

export function groupedEndpoints() {
  return groupBy(allEndpoints, ALL_GROUPS);
}
