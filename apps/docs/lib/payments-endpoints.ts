import type { EndpointDoc } from "@/lib/types";

const BASE = "/api/v1/pawapay";

const FINANCE_ROLES = ["ADMIN", "ACCOUNTANT"];

const sampleDeposit = {
  depositId: "SWG-DEP-9f8e7d6c5b4a3210",
  status: "ACCEPTED",
  created: "2026-02-15T09:00:00.000Z",
};

const samplePayout = {
  payoutId: "pay_5e6f7a8b",
  status: "ACCEPTED",
  amount: "50.00",
  currency: "USD",
  recipient: { type: "MMO", accountDetails: { phoneNumber: "243812345678", provider: "MTN_MOMO_COD" } },
};

const sampleRefund = {
  refundId: "ref_1a2b3c4d",
  depositId: "SWG-DEP-9f8e7d6c5b4a3210",
  status: "ACCEPTED",
};

const sampleWalletBalances = {
  balances: [
    { currency: "USD", amount: "1250.00" },
    { currency: "CDF", amount: "3500000" },
  ],
};

export const PAYMENTS_GROUPS = ["Deposits", "Payouts", "Refunds", "Wallet & Configuration"] as const;

export const paymentsEndpoints: EndpointDoc[] = [
  // --- Deposits ---
  {
    slug: "initiate-deposit",
    method: "POST",
    path: `${BASE}/deposits`,
    title: "Initiate deposit",
    group: "Deposits",
    auth: "bearer",
    roles: ["ADMIN"],
    rateLimit: "Payment",
    description: "Requests a mobile money charge from a payer through PawaPay — used internally for subscription billing. Buyer checkout uses MbiyoPay instead, not this endpoint.",
    bodyParams: [
      { name: "amount", type: "number", required: true, description: "Greater than 0." },
      { name: "currency", type: "string", required: true, description: "e.g. USD." },
      { name: "country", type: "string", required: true, description: "ISO country code." },
      { name: "provider", type: "string", required: true, description: "Mobile money provider code, e.g. MTN_MOMO_COD." },
      { name: "payerPhoneNumber", type: "string", required: true, description: "Digits only, with country code, no leading +." },
      { name: "customerMessage", type: "string", required: true, description: "4–22 alphanumeric characters — shown to the payer." },
      { name: "clientReferenceId", type: "string", required: false, description: "Your own reference for this deposit." },
      { name: "metadata", type: "object", required: false, description: "Up to 10 key/value entries, forwarded to PawaPay." },
    ],
    successStatus: 201,
    responseExample: { success: true, data: sampleDeposit },
    notes: ["If depositId isn't provided, one is derived deterministically from the request's amount, currency, provider, and phone number within a 5-minute window — an accidental duplicate submission resolves to the same deposit instead of charging twice."],
  },
  {
    slug: "get-deposit-status",
    method: "GET",
    path: `${BASE}/deposits/:depositId`,
    title: "Get deposit status",
    group: "Deposits",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Checks a deposit's current status directly with PawaPay.",
    pathParams: [{ name: "depositId", type: "string", required: true, description: "Deposit ID." }],
    successStatus: 200,
    responseExample: { success: true, data: { ...sampleDeposit, status: "COMPLETED" } },
  },
  // --- Payouts ---
  {
    slug: "request-payout-approval",
    method: "POST",
    path: `${BASE}/payouts/request-approval`,
    title: "Request payout approval",
    group: "Payouts",
    auth: "bearer",
    roles: ["ADMIN"],
    rateLimit: "Payout OTP",
    description: "First step of the OTP-gated payout flow — validates the payout details and emails a verification code to the requesting admin. Nothing is sent to PawaPay yet.",
    bodyParams: [
      { name: "amount", type: "number", required: true, description: "Greater than 0." },
      { name: "currency", type: "string", required: true, description: "e.g. USD." },
      { name: "country", type: "string", required: true, description: "ISO country code." },
      { name: "provider", type: "string", required: true, description: "Mobile money provider code." },
      { name: "recipientPhoneNumber", type: "string", required: true, description: "Digits only, with country code." },
      { name: "customerMessage", type: "string", required: true, description: "4–22 alphanumeric characters." },
      { name: "clientReferenceId", type: "string", required: false, description: "Your own reference for this payout." },
    ],
    successStatus: 200,
    responseExample: {
      success: true,
      data: { pendingId: "9f8e7d6c-5b4a-3210-9f8e-7d6c5b4a3210", message: "Un code de vérification a été envoyé à admin@swiftgoma.com. Saisissez-le pour approuver ce paiement.", expiresInMinutes: 5, summary: { amount: 50, currency: "USD", country: "CD", provider: "MTN_MOMO_COD", recipientPhoneNumber: "243812345678" } },
    },
    notes: [
      "Also enforces a daily payout count and per-currency amount limit for the requesting admin.",
      "This is the same OTP-gated payout mechanism the expense-approval flow uses to pay vendors — it's not used for seller wallet payouts, which go through MbiyoPay instead.",
    ],
  },
  {
    slug: "confirm-payout",
    method: "POST",
    path: `${BASE}/payouts/confirm`,
    title: "Confirm payout",
    group: "Payouts",
    auth: "bearer",
    roles: ["ADMIN"],
    rateLimit: "Payout confirm",
    description: "Second step — submits the verification code and, if correct, actually sends the payout to PawaPay.",
    bodyParams: [
      { name: "pendingId", type: "string", required: true, description: "From POST /payouts/request-approval." },
      { name: "code", type: "string", required: true, description: "The verification code from the email." },
    ],
    successStatus: 201,
    responseExample: { success: true, data: samplePayout },
    errorExamples: [
      { status: 401, code: "UNAUTHORIZED", message: "Code de vérification invalide." },
      { status: 429, code: "TOO_MANY_REQUESTS", message: "Trop de tentatives de vérification invalides. Veuillez patienter avant de réessayer." },
    ],
    notes: ["Only one confirm can run at a time per admin — a second concurrent attempt is rejected rather than queued."],
  },
  {
    slug: "get-payout-history",
    method: "GET",
    path: `${BASE}/payouts/history`,
    title: "Get payout history",
    group: "Payouts",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Lists past PawaPay payouts initiated through this API.",
    queryParams: [
      { name: "page", type: "number", required: false, description: "Defaults to 1." },
      { name: "limit", type: "number", required: false, description: "Max 100. Defaults to 20." },
      { name: "status", type: "string", required: false, description: "Filter by internal payout status." },
    ],
    successStatus: 200,
    responseExample: {
      success: true,
      data: { payouts: [samplePayout], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    },
  },
  {
    slug: "get-payout-status",
    method: "GET",
    path: `${BASE}/payouts/:payoutId`,
    title: "Get payout status",
    group: "Payouts",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Checks a payout's current status directly with PawaPay.",
    pathParams: [{ name: "payoutId", type: "string", required: true, description: "Payout ID." }],
    successStatus: 200,
    responseExample: { success: true, data: { ...samplePayout, status: "COMPLETED" } },
  },
  // --- Refunds ---
  {
    slug: "request-refund-approval",
    method: "POST",
    path: `${BASE}/refunds/request-approval`,
    title: "Request refund approval",
    group: "Refunds",
    auth: "bearer",
    roles: ["ADMIN"],
    rateLimit: "Payout OTP",
    description: "Same OTP-gated pattern as payouts, for refunding a deposit — request a code first.",
    bodyParams: [
      { name: "depositId", type: "string", required: true, description: "The deposit being refunded." },
      { name: "amount", type: "number", required: false, description: "Omit to refund the full amount." },
      { name: "currency", type: "string", required: false, description: "" },
      { name: "country", type: "string", required: false, description: "" },
      { name: "provider", type: "string", required: false, description: "" },
    ],
    successStatus: 200,
    responseExample: {
      success: true,
      data: { pendingId: "1a2b3c4d-5e6f-7890-1a2b-3c4d5e6f7890", message: "Un code de vérification a été envoyé à admin@swiftgoma.com.", expiresInMinutes: 5 },
    },
  },
  {
    slug: "confirm-refund",
    method: "POST",
    path: `${BASE}/refunds/confirm`,
    title: "Confirm refund",
    group: "Refunds",
    auth: "bearer",
    roles: ["ADMIN"],
    rateLimit: "Payout confirm",
    description: "Submits the code and sends the refund to PawaPay.",
    bodyParams: [
      { name: "pendingId", type: "string", required: true, description: "From POST /refunds/request-approval." },
      { name: "code", type: "string", required: true, description: "The verification code from the email." },
    ],
    successStatus: 201,
    responseExample: { success: true, data: sampleRefund },
  },
  {
    slug: "get-refund-status",
    method: "GET",
    path: `${BASE}/refunds/:refundId`,
    title: "Get refund status",
    group: "Refunds",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Checks a refund's current status directly with PawaPay.",
    pathParams: [{ name: "refundId", type: "string", required: true, description: "Refund ID." }],
    successStatus: 200,
    responseExample: { success: true, data: { ...sampleRefund, status: "COMPLETED" } },
  },
  // --- Wallet & Configuration ---
  {
    slug: "get-wallet-balances",
    method: "GET",
    path: `${BASE}/wallet-balances`,
    title: "Get wallet balances",
    group: "Wallet & Configuration",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Returns the platform's current PawaPay wallet balances, by currency.",
    successStatus: 200,
    responseExample: { success: true, data: sampleWalletBalances },
  },
  {
    slug: "get-active-configuration",
    method: "GET",
    path: `${BASE}/active-configuration`,
    title: "Get active configuration",
    group: "Wallet & Configuration",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Returns which countries, mobile money providers, and currencies are currently enabled on the connected PawaPay account — and their amount decimal formatting rules.",
    queryParams: [
      { name: "country", type: "string", required: false, description: "Filter to one country." },
      { name: "operationType", type: "string", required: false, description: "DEPOSIT, PAYOUT, or REFUND." },
      { name: "currency", type: "string", required: false, description: "Filter to one currency." },
    ],
    successStatus: 200,
    responseExample: {
      success: true,
      data: {
        countries: [
          {
            country: "CD",
            providers: [
              { provider: "MTN_MOMO_COD", currencies: [{ currency: "USD", operationTypes: { DEPOSIT: { decimalsInAmount: "TWO" }, PAYOUT: { decimalsInAmount: "TWO" } } }] },
            ],
          },
        ],
      },
    },
  },
];
