import type { EndpointDoc } from "@/lib/types";

const SETTINGS_BASE = "/api/v1/wallet-settings";
const WALLET_BASE = "/api/v1/wallet";

const sampleWalletSettings = {
  id: "ws_1a2b3c",
  sellerProfileId: "sp_2b3c4d",
  payoutPhoneNumber: "243812345678",
  payoutProvider: "MTN_MOMO_COD",
  payoutCountry: "CD",
  minimumPayoutAmounts: { USD: 20, CDF: 50000 },
};

const sampleWallet = {
  sellerProfileId: "sp_2b3c4d",
  balances: [
    { currency: "USD", available: "184.50", pending: "12.00" },
  ],
};

const sampleWalletTransaction = {
  id: "wtx_1a2b3c",
  sellerProfileId: "sp_2b3c4d",
  type: "ORDER_EARNING",
  amount: "22.00",
  currency: "USD",
  orderId: "ord_5e6f7a",
  createdAt: "2026-02-15T11:00:00.000Z",
};

export const WALLET_GROUPS = ["Wallet Settings", "Wallet"] as const;

export const walletEndpoints: EndpointDoc[] = [
  // --- Wallet Settings ---
  {
    slug: "create-wallet-settings",
    method: "POST",
    path: SETTINGS_BASE,
    title: "Create wallet settings",
    group: "Wallet Settings",
    auth: "bearer",
    roles: ["SELLER"],
    rateLimit: "Authenticated action",
    description: "Sets the mobile money number a seller's payouts are sent to — required before any withdrawal can be requested.",
    bodyParams: [
      { name: "payoutPhoneNumber", type: "string", required: true, description: "" },
      { name: "payoutProvider", type: "string", required: true, description: "Mobile money provider code." },
      { name: "payoutCountry", type: "string", required: true, description: "" },
      { name: "minimumPayoutAmounts", type: "object", required: false, description: "Per-currency minimum withdrawal amount, e.g. { \"USD\": 20 }." },
    ],
    successStatus: 201,
    responseExample: { success: true, data: sampleWalletSettings },
  },
  {
    slug: "get-my-wallet-settings",
    method: "GET",
    path: `${SETTINGS_BASE}/me`,
    title: "Get my wallet settings",
    group: "Wallet Settings",
    auth: "bearer",
    roles: ["SELLER"],
    rateLimit: "Session",
    description: "Returns the signed-in seller's wallet settings.",
    successStatus: 200,
    responseExample: { success: true, data: sampleWalletSettings },
  },
  {
    slug: "update-wallet-settings",
    method: "PUT",
    path: SETTINGS_BASE,
    title: "Update wallet settings",
    group: "Wallet Settings",
    auth: "bearer",
    roles: ["SELLER"],
    rateLimit: "Authenticated action",
    description: "Updates the seller's payout phone number, provider, or minimum payout amounts.",
    bodyParams: [
      { name: "payoutPhoneNumber", type: "string", required: false, description: "" },
      { name: "payoutProvider", type: "string", required: false, description: "" },
      { name: "payoutCountry", type: "string", required: false, description: "" },
      { name: "minimumPayoutAmounts", type: "object", required: false, description: "" },
    ],
    successStatus: 200,
    responseExample: { success: true, data: sampleWalletSettings },
  },
  // --- Wallet ---
  {
    slug: "get-my-wallet",
    method: "GET",
    path: `${WALLET_BASE}/me`,
    title: "Get my wallet",
    group: "Wallet",
    auth: "bearer",
    roles: ["SELLER"],
    rateLimit: "Session",
    description: "Returns the seller's wallet balances — available (withdrawable) and pending (from orders not yet completed).",
    successStatus: 200,
    responseExample: { success: true, data: sampleWallet },
  },
  {
    slug: "get-my-wallet-transactions",
    method: "GET",
    path: `${WALLET_BASE}/me/transactions`,
    title: "Get my wallet transactions",
    group: "Wallet",
    auth: "bearer",
    roles: ["SELLER"],
    rateLimit: "Session",
    description: "Lists the seller's wallet ledger — order earnings, payouts, and adjustments.",
    queryParams: [
      { name: "page", type: "number", required: false, description: "Defaults to 1." },
      { name: "limit", type: "number", required: false, description: "Max 100. Defaults to 20." },
      { name: "type", type: "string", required: false, description: "Filter by transaction type." },
    ],
    successStatus: 200,
    responseExample: {
      success: true,
      data: { transactions: [sampleWalletTransaction], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    },
  },
  {
    slug: "request-wallet-payout-otp",
    method: "POST",
    path: `${WALLET_BASE}/payout/otp`,
    title: "Request payout OTP",
    group: "Wallet",
    auth: "bearer",
    roles: ["SELLER"],
    rateLimit: "Payout OTP",
    description: "First step of withdrawing from the wallet — sends a verification code to the seller.",
    successStatus: 200,
    responseExample: { success: true, data: { message: "Un code de vérification a été envoyé.", expiresInMinutes: 5 } },
  },
  {
    slug: "initiate-wallet-payout",
    method: "POST",
    path: `${WALLET_BASE}/payout`,
    title: "Withdraw from wallet",
    group: "Wallet",
    auth: "bearer",
    roles: ["SELLER"],
    rateLimit: "Payout confirm",
    description: "Second step — submits the OTP code and requests a payout of the given amount to the seller's configured payout number, via MbiyoPay.",
    bodyParams: [
      { name: "currency", type: "string", required: true, description: "Must have a sufficient available balance." },
      { name: "amount", type: "number", required: true, description: "Must meet the currency's configured minimum payout amount." },
      { name: "otpCode", type: "string", required: true, description: "From POST /payout/otp." },
    ],
    successStatus: 201,
    responseExample: { success: true, data: { ...sampleWalletTransaction, type: "PAYOUT", amount: "-100.00" } },
    errorExamples: [
      { status: 409, code: "CONFLICT", message: "Solde disponible insuffisant pour ce retrait." },
    ],
  },
];
