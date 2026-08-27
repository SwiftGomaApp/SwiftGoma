import type { EndpointDoc } from "@/lib/types";

const ACCOUNTING_BASE = "/api/v1/accounting";
const TRANSACTIONS_BASE = "/api/v1/payments/transactions";
const LEDGER_BASE = "/api/v1/payments/ledger";

const FINANCE_ROLES = ["ADMIN", "ACCOUNTANT"];

const sampleReport = {
  reference: "SWG-REP-2026-02",
  period: { from: "2026-02-01T00:00:00.000Z", to: "2026-02-28T23:59:59.000Z" },
  summary: {
    subscriptionRevenue: [{ currency: "USD", total: "1280.00", count: 128 }],
    orderPayments: [{ currency: "USD", total: "18420.00", count: 640 }],
    orderGmv: [{ currency: "USD", total: "19100.00", count: 660 }],
    invoices: { total: 128 },
    adminPayouts: { count: 14 },
    sellerPayouts: { count: 96 },
  },
};

const sampleTransaction = {
  id: "payout_1a2b3c",
  provider: "mbiyopay",
  amount: "100.00",
  currency: "USD",
  status: "COMPLETED",
  reference: "SWG-OUT-1a2b3c4d5e6f7890",
  createdAt: "2026-02-15T09:00:00.000Z",
};

const sampleLedgerEntry = {
  id: "ledger_1a2b3c",
  source: "ORDER_PAYMENT",
  direction: "IN",
  amount: "27.00",
  currency: "USD",
  status: "COMPLETED",
  reference: "ord_5e6f7a",
  label: "Paiement commande ord_5e6f7a",
  provider: "mbiyopay",
  createdAt: "2026-02-15T09:05:00.000Z",
};

export const ACCOUNTING_GROUPS = ["Reports", "Transactions & Ledger"] as const;

export const accountingEndpoints: EndpointDoc[] = [
  // --- Reports ---
  {
    slug: "get-accountant-report-preview",
    method: "GET",
    path: `${ACCOUNTING_BASE}/report`,
    title: "Preview accountant report",
    group: "Reports",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Builds a financial summary for a period — subscription revenue, order payments and GMV, invoices, and payout counts — without generating a file.",
    queryParams: [
      { name: "from", type: "string", required: false, description: "ISO date. Defaults to the start of the current month." },
      { name: "to", type: "string", required: false, description: "ISO date. Defaults to now." },
    ],
    successStatus: 200,
    responseExample: { success: true, data: sampleReport },
  },
  {
    slug: "download-accountant-report-pdf",
    method: "GET",
    path: `${ACCOUNTING_BASE}/report/pdf`,
    title: "Download report (PDF)",
    group: "Reports",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Generates the same report as a downloadable PDF, and stores a copy for later retrieval via the report history.",
    queryParams: [
      { name: "from", type: "string", required: false, description: "ISO date." },
      { name: "to", type: "string", required: false, description: "ISO date." },
    ],
    successStatus: 200,
    responseExample: { success: true, data: { message: "Returns application/pdf — not a JSON body." } },
  },
  {
    slug: "download-accountant-report-csv",
    method: "GET",
    path: `${ACCOUNTING_BASE}/report/csv`,
    title: "Download report (CSV)",
    group: "Reports",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Same report data as a CSV file.",
    queryParams: [
      { name: "from", type: "string", required: false, description: "ISO date." },
      { name: "to", type: "string", required: false, description: "ISO date." },
    ],
    successStatus: 200,
    responseExample: { success: true, data: { message: "Returns text/csv — not a JSON body." } },
  },
  {
    slug: "send-accountant-report-email",
    method: "POST",
    path: `${ACCOUNTING_BASE}/report/email`,
    title: "Email report",
    group: "Reports",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Generates the PDF report and emails it to configured admin recipients.",
    bodyParams: [
      { name: "from", type: "string", required: false, description: "ISO date." },
      { name: "to", type: "string", required: false, description: "ISO date." },
    ],
    successStatus: 200,
    responseExample: { success: true, data: { sent: true, reference: sampleReport.reference } },
  },
  {
    slug: "get-report-history",
    method: "GET",
    path: `${ACCOUNTING_BASE}/reports`,
    title: "Get report history",
    group: "Reports",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Lists previously generated reports.",
    queryParams: [
      { name: "page", type: "number", required: false, description: "Defaults to 1." },
      { name: "limit", type: "number", required: false, description: "Max 100. Defaults to 20." },
    ],
    successStatus: 200,
    responseExample: {
      success: true,
      data: { reports: [{ reference: sampleReport.reference, generatedByLabel: "Aline Mapendo", createdAt: "2026-03-01T08:00:00.000Z" }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    },
  },
  {
    slug: "download-stored-report",
    method: "GET",
    path: `${ACCOUNTING_BASE}/reports/:id/pdf`,
    title: "Download stored report",
    group: "Reports",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Re-downloads a previously generated report's PDF without regenerating it.",
    pathParams: [{ name: "id", type: "string", required: true, description: "Stored report ID." }],
    successStatus: 200,
    responseExample: { success: true, data: { message: "Returns application/pdf — not a JSON body." } },
  },
  // --- Transactions & Ledger ---
  {
    slug: "get-admin-transactions",
    method: "GET",
    path: TRANSACTIONS_BASE,
    title: "List payout transactions",
    group: "Transactions & Ledger",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Lists admin-initiated payouts across both PawaPay and MbiyoPay in one place.",
    queryParams: [
      { name: "provider", type: "string", required: false, description: "pawapay or mbiyopay. Omit for both." },
      { name: "page", type: "number", required: false, description: "Defaults to 1." },
      { name: "limit", type: "number", required: false, description: "Max 100. Defaults to 20." },
      { name: "status", type: "string", required: false, description: "Filter by payout status." },
      { name: "search", type: "string", required: false, description: "" },
    ],
    successStatus: 200,
    responseExample: {
      success: true,
      data: { transactions: [sampleTransaction], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    },
  },
  {
    slug: "get-payment-ledger",
    method: "GET",
    path: LEDGER_BASE,
    title: "Get payment ledger",
    group: "Transactions & Ledger",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "A unified ledger of every money movement on the platform — order payments, subscription payments, payouts, and refunds — regardless of provider or feature.",
    queryParams: [
      { name: "page", type: "number", required: false, description: "Defaults to 1." },
      { name: "limit", type: "number", required: false, description: "Max 100. Defaults to 20." },
      { name: "source", type: "string", required: false, description: "e.g. ORDER_PAYMENT, SUBSCRIPTION_PAYMENT, ADMIN_PAYOUT." },
      { name: "direction", type: "string", required: false, description: "IN or OUT." },
    ],
    successStatus: 200,
    responseExample: {
      success: true,
      data: { entries: [sampleLedgerEntry], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    },
  },
  {
    slug: "export-payment-ledger-csv",
    method: "GET",
    path: `${LEDGER_BASE}/export/csv`,
    title: "Export ledger (CSV)",
    group: "Transactions & Ledger",
    auth: "bearer",
    roles: FINANCE_ROLES,
    rateLimit: "Session",
    description: "Exports the payment ledger as a CSV file, respecting the same filters as the JSON endpoint.",
    queryParams: [
      { name: "source", type: "string", required: false, description: "" },
      { name: "direction", type: "string", required: false, description: "IN or OUT." },
    ],
    successStatus: 200,
    responseExample: { success: true, data: { message: "Returns text/csv — not a JSON body." } },
  },
];
