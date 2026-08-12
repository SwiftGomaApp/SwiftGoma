import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";
import type { InvoiceStats } from "@/lib/api/routes/billing";
import type {
  SubscriptionStats,
  SubscriptionRevenue,
} from "@/lib/api/routes/subscriptions";

export interface AccountantReportPeriod {
  from: string;
  to: string;
}

export interface AccountantReportSummary {
  subscriptionRevenue: { currency: string; total: number; count: number }[];
  orderPayments: { currency: string; total: number; count: number }[];
  orderGmv: { currency: string; total: number; count: number }[];
  invoices: {
    total: number;
    INVOICE: number;
    RECEIPT: number;
    PAYOUT_RECEIPT: number;
  };
  adminPayouts: {
    count: number;
    totals: { currency: string; total: number; count: number }[];
  };
  sellerPayouts: {
    count: number;
    totals: { currency: string; total: number; count: number }[];
  };
  companyExpenses: {
    count: number;
    totals: { currency: string; total: number; count: number }[];
    pending: number;
  };
}

export interface AccountantReport {
  reference: string;
  generatedAt: string;
  requestedBy: string | null;
  period: AccountantReportPeriod;
  truncated: boolean;
  summary: AccountantReportSummary;
}

export interface AccountantReportEmailResult {
  reference: string;
  recipients: string[];
  period: AccountantReportPeriod;
  sentAt: string;
  stored?: StoredAccountantReport;
}

export type AccountantReportSource = "DOWNLOAD" | "EMAIL" | "SCHEDULED";

export interface StoredAccountantReport {
  id: string;
  reference: string;
  period: AccountantReportPeriod;
  generatedByLabel: string;
  generatedBy: { id: string; name: string } | null;
  source: AccountantReportSource;
  recipients: string[];
  summary: AccountantReportSummary | null;
  truncated: boolean;
  createdAt: string;
}

export interface AccountantReportHistoryResponse {
  items: StoredAccountantReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AccountantOverview {
  invoices: InvoiceStats;
  subscriptions: SubscriptionStats;
  revenue: SubscriptionRevenue;
  orders: {
    total: number;
    completed: number;
    gmvByCurrency: { currency: string; total: number; orderCount: number }[];
  };
  adminPayouts: {
    total: number;
    byStatus: { PROCESSING: number; COMPLETED: number; FAILED: number };
  };
  sellerPayouts: {
    total: number;
    byStatus: Record<string, number>;
  };
  generatedAt: string;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getDefaultReportPeriod() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: toDateInputValue(from),
    to: toDateInputValue(now),
  };
}

export async function getAccountantOverview(): Promise<AccountantOverview> {
  const res = await apiClient.get("/dashboard/accountant-overview");
  return unwrap(res);
}

export async function getAccountantReport(params: {
  from?: string;
  to?: string;
}): Promise<AccountantReport> {
  const res = await apiClient.get("/accounting/report", { params });
  return unwrap(res);
}

export async function downloadAccountantReportPdf(params: {
  from?: string;
  to?: string;
}): Promise<{ blob: Blob; filename: string }> {
  const res = await apiClient.get("/accounting/report/pdf", {
    params,
    responseType: "blob",
  });

  const disposition = res.headers["content-disposition"] as string | undefined;
  const filenameMatch = disposition?.match(/filename="(.+?)"/);
  const filename = filenameMatch?.[1] ?? "rapport-comptable.pdf";

  return { blob: res.data as Blob, filename };
}

export async function emailAccountantReportToAdmins(params: {
  from?: string;
  to?: string;
}): Promise<AccountantReportEmailResult> {
  const res = await apiClient.post("/accounting/report/email", params);
  return unwrap(res);
}

export async function getAccountantReportHistory(params: {
  page?: number;
  limit?: number;
}): Promise<AccountantReportHistoryResponse> {
  const res = await apiClient.get("/accounting/reports", { params });
  return unwrap(res);
}

export async function downloadStoredAccountantReportPdf(
  id: string,
): Promise<{ blob: Blob; filename: string }> {
  const res = await apiClient.get(`/accounting/reports/${id}/pdf`, {
    responseType: "blob",
  });

  const disposition = res.headers["content-disposition"] as string | undefined;
  const filenameMatch = disposition?.match(/filename="(.+?)"/);
  const filename = filenameMatch?.[1] ?? "rapport-comptable.pdf";

  return { blob: res.data as Blob, filename };
}

export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
