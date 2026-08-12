import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";

export interface InvoiceMonthRow {
  month: string;
  type: "INVOICE" | "RECEIPT";
  count: number;
}

export interface InvoiceStats {
  totalDocuments: number;
  byType: { INVOICE: number; RECEIPT: number };
  byMonth: InvoiceMonthRow[];
}

export async function getInvoiceStats(): Promise<InvoiceStats> {
  const res = await apiClient.get("/invoices/stats");
  return unwrap(res);
}

export interface AdminInvoiceRecord {
  id: string;
  documentNumber: string;
  type: "INVOICE" | "RECEIPT" | "PAYOUT_RECEIPT";
  pdfUrl: string;
  issuedAt: string;
  sellerProfile: { id: string; businessName: string };
  subscriptionPayment?: { amount: string; currency: string; status: string } | null;
  orderPayment?: { amount: string; currency: string; status: string } | null;
  walletTransaction?: { amount: string; currency: string; status: string } | null;
}

export interface AdminInvoiceListResponse {
  items: AdminInvoiceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listAdminInvoices(params: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
} = {}): Promise<AdminInvoiceListResponse> {
  const res = await apiClient.get("/invoices/admin", {
    params: {
      page: params.page,
      limit: params.limit,
      type: params.type || undefined,
      search: params.search?.trim() || undefined,
    },
  });
  return unwrap(res);
}

export async function getAdminInvoice(id: string): Promise<AdminInvoiceRecord> {
  const res = await apiClient.get(`/invoices/admin/${id}`);
  return unwrap(res);
}
