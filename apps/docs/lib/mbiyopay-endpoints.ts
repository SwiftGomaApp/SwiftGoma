import type { EndpointDoc } from "@/lib/types";

const BASE = "/api/v1/mbiyopay";

const FINANCE_ROLES = ["ADMIN", "ACCOUNTANT"];

const sampleTransaction = {
  orderId: "SWG-IN-9f8e7d6c5b4a3210",
  transactionId: "txn_5e6f7a8b",
  status: "pending",
  amount: 50,
  currency: "USD",
  network: "vodacom",
  countryCode: "CD",
  createdAt: "2026-02-15T09:00:00.000Z",
};

const samplePayout = {
  orderId: "SWG-OUT-1a2b3c4d5e6f7890",
  transactionId: "txn_9c8d7e6f",
  status: "pending",
  amount: 50,
  currency: "USD",
  network: "airtel",
  countryCode: "CD",
  beneficiary: "Aline Mapendo",
};

const sampleBalances = {
  balances: [
    { currency: "USD", amount: "820.00" },
    { currency: "CDF", amount: "2100000" },
    { currency: "RWF", amount: "450000" },
  ],
};

const sampleNetworkBalances = {
  balances: [
    { countryCode: "CD", network: "vodacom", currency: "CDF", amount: "900000" },
    { countryCode: "CD", network: "airtel", currency: "USD", amount: "300.00" },
  ],
};

const sampleCountry = {
  code: "CD",
  name: "République démocratique du Congo",
  networks: ["vodacom", "airtel", "orange", "africell"],
  currencies: ["USD", "CDF"],
};

export const MBIYOPAY_GROUPS = ["Payin", "Payout", "Transactions & Balances"] as const;

export const mbiyopayEndpoints: EndpointDoc[] = [
  // --- Payin ---
  {
    slug: "initiate-payin",
    method: "POST",
    path: `${BASE}/payin`,
    title: "Initiate payin",
    group: "Payin",
    auth: "bearer",
    roles: ["ADMIN"],
    rateLimit: "Payment",
    description: "Requests a mobile money charge from a payer through MbiyoPay — the same underlying call buyer checkout uses, covering DRC and Rwanda.",
    bodyParams: [
      { name: "amount", type: "number", required: true, description: "Within the supported range for the currency — see Supported countries below." },
      { name: "currency", type: "string", required: true, description: "Must be supported by the given countryCode." },
      { name: "network", type: "string", required: true, description: "Must be supported by the given countryCode." },
      { name: "phoneNumber", type: "string", required: true, description: "9–15 digits — formatting characters are stripped automatically." },
      { name: "countryCode", type: "string", required: true, description: "CD or RW." },
      { name: "orderId", type: "string", required: false, description: "Your own reference. Auto-generated if omitted." },
    ],
    successStatus: 201,
    responseExample: { success: true, data: sampleTransaction },
    errorExamples: [
      { status: 400, code: "MBIYOPAY_PAYIN_FAILED", message: "Le paiement a été refusé par l'opérateur mobile money." },
    ],
    notes: ["If orderId isn't provided, one is derived deterministically from amount, currency, network, and phone number within a 5-minute window — a duplicate submission resolves to the same payin instead of charging twice."],
  },
  // --- Payout ---
  {
    slug: "request-mbiyopay-payout-approval",
    method: "POST",
    path: `${BASE}/payout/request-approval`,
    title: "Request payout approval",
    group: "Payout",
    auth: "bearer",
    roles: ["ADMIN"],
    rateLimit: "Payout OTP",
    description: "First step of the OTP-gated payout flow — the same pattern used for PawaPay. Validates the request and emails a verification code; nothing is sent to MbiyoPay yet.",
    bodyParams: [
      { name: "amount", type: "number", required: true, description: "Within the supported range for the currency." },
      { name: "currency", type: "string", required: true, description: "Must be supported by the given countryCode." },
      { name: "network", type: "string", required: true, description: "Must be supported by the given countryCode." },
      { name: "phoneNumber", type: "string", required: true, description: "9–15 digits." },
      { name: "countryCode", type: "string", required: true, description: "CD or RW." },
      { name: "beneficiary", type: "string", required: true, description: "Name of the payout recipient." },
      { name: "orderId", type: "string", required: false, description: "Your own reference." },
    ],
    successStatus: 200,
    responseExample: {
      success: true,
      data: { pendingId: "9f8e7d6c-5b4a-3210-9f8e-7d6c5b4a3210", message: "Un code de vérification a été envoyé à admin@swiftgoma.com. Saisissez-le pour approuver ce paiement.", expiresInMinutes: 5, summary: { amount: 50, currency: "USD", beneficiary: "Aline Mapendo", phoneNumber: "243812345678", network: "airtel" } },
    },
    notes: ["Also enforces a daily payout count and per-currency amount limit for the requesting admin — shared with PawaPay's payout limits."],
  },
  {
    slug: "confirm-mbiyopay-payout",
    method: "POST",
    path: `${BASE}/payout/confirm`,
    title: "Confirm payout",
    group: "Payout",
    auth: "bearer",
    roles: ["ADMIN"],
    rateLimit: "Payout confirm",
    description: "Second step — submits the verification code and, if correct, sends the payout to MbiyoPay.",
    bodyParams: [
      { name: "pendingId", type: "string", required: true, description: "From POST /payout/request-approval." },
      { name: "code", type: "string", required: true, description: "The verification code from the email." },
    ],
    successStatus: 201,
    responseExample: { success: true, data: samplePayout },
    errorExamples: [
      { status: 403, code: "MBIYOPAY_KYC_REQUIRED", message: "Approbation KYC requise pour les paiements sortants en production." },
      { status: 400, code: "MBIYOPAY_INSUFFICIENT_BALANCE", message: "Solde MbiyoPay insuffisant pour ce paiement sortant." },
    ],
  },
  {
    slug: "get-mbiyopay-payout-history",
    method: "GET",
    path: `${BASE}/payout/history`,
    title: "Get payout history",
    group: "Payout",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Lists past MbiyoPay payouts initiated through this API.",
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
  // --- Transactions & Balances ---
  {
    slug: "get-mbiyopay-transaction-status",
    method: "GET",
    path: `${BASE}/transactions/:transactionId`,
    title: "Get transaction status",
    group: "Transactions & Balances",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Checks a payin or payout's current status directly with MbiyoPay. Accepts either the MbiyoPay transaction ID or your own orderId.",
    pathParams: [{ name: "transactionId", type: "string", required: true, description: "Transaction ID or orderId." }],
    successStatus: 200,
    responseExample: { success: true, data: { ...sampleTransaction, status: "success" } },
  },
  {
    slug: "get-mbiyopay-balances",
    method: "GET",
    path: `${BASE}/balances`,
    title: "Get wallet balances",
    group: "Transactions & Balances",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Returns the platform's current MbiyoPay wallet balances.",
    queryParams: [{ name: "currency", type: "string", required: false, description: "Filter to one currency." }],
    successStatus: 200,
    responseExample: { success: true, data: sampleBalances },
  },
  {
    slug: "get-mbiyopay-network-balances",
    method: "GET",
    path: `${BASE}/balances/networks`,
    title: "Get network balances",
    group: "Transactions & Balances",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Returns balances broken down per mobile money network — useful for spotting when one specific network's float is running low.",
    queryParams: [
      { name: "currency", type: "string", required: false, description: "Filter to one currency." },
      { name: "countryCode", type: "string", required: false, description: "Filter to one country." },
    ],
    successStatus: 200,
    responseExample: { success: true, data: sampleNetworkBalances },
  },
  {
    slug: "get-mbiyopay-countries",
    method: "GET",
    path: `${BASE}/countries`,
    title: "List supported countries",
    group: "Transactions & Balances",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Lists the countries, networks, and currencies currently enabled on the connected MbiyoPay account.",
    queryParams: [
      { name: "all", type: "boolean", required: false, description: "Return every country in one response, unpaginated." },
      { name: "page", type: "number", required: false, description: "Ignored when all=true. Defaults to 1." },
      { name: "limit", type: "number", required: false, description: "Ignored when all=true. Defaults to 20." },
    ],
    successStatus: 200,
    responseExample: { success: true, data: [sampleCountry] },
  },
];
