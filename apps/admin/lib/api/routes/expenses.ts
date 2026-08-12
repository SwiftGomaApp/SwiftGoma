import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";

export type ExpenseCategory =
  | "OPERATIONS"
  | "MARKETING"
  | "PAYROLL"
  | "LEGAL"
  | "TRAVEL"
  | "UTILITIES"
  | "EQUIPMENT"
  | "OTHER";

export type ExpenseStatus =
  | "PENDING"
  | "REJECTED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface ExpenseRecord {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  category: ExpenseCategory;
  status: ExpenseStatus;
  amount: number | string;
  currency: string;
  incurredAt: string;
  vendorName: string;
  vendorPhone: string;
  countryCode: string;
  providerName: string;
  customerMessage: string;
  receiptUrl: string | null;
  adminPayoutId: string | null;
  createdBy: { id: string; name: string } | null;
  approvedBy: { id: string; name: string } | null;
  approvedAt: string | null;
  rejectedBy: { id: string; name: string } | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  adminPayout: {
    id: string;
    status: string;
    externalId: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListResponse {
  items: ExpenseRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateExpenseInput {
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  incurredAt: string;
  vendorName: string;
  vendorPhone: string;
  countryCode?: string;
  providerName: string;
  customerMessage: string;
  receipt?: File | null;
}

export interface ExpenseApprovalRequestResult {
  pendingId: string;
  message: string;
  expiresInMinutes: number;
  summary: {
    expenseId: string;
    reference: string;
    title: string;
    amount: number;
    currency: string;
    vendorName: string;
  };
}

export async function getExpenseMeta(): Promise<{
  categories: ExpenseCategory[];
}> {
  const res = await apiClient.get("/expenses/meta");
  return unwrap(res);
}

export async function listExpenses(params: {
  page?: number;
  limit?: number;
  status?: ExpenseStatus;
  category?: ExpenseCategory;
}): Promise<ExpenseListResponse> {
  const res = await apiClient.get("/expenses", { params });
  return unwrap(res);
}

export async function createExpense(
  input: CreateExpenseInput,
): Promise<ExpenseRecord> {
  const form = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (key === "receipt") return;
    if (value !== undefined && value !== null && value !== "") {
      form.append(key, String(value));
    }
  });
  if (input.receipt) {
    form.append("receipt", input.receipt);
  }

  const res = await apiClient.post("/expenses", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(res);
}

export async function rejectExpense(
  id: string,
  reason: string,
): Promise<ExpenseRecord> {
  const res = await apiClient.post(`/expenses/${id}/reject`, { reason });
  return unwrap(res);
}

export async function requestExpenseApproval(
  id: string,
): Promise<ExpenseApprovalRequestResult> {
  const res = await apiClient.post(`/expenses/${id}/approve/request`);
  return unwrap(res);
}

export async function resendExpenseApproval(
  id: string,
  payload: { pendingId: string },
): Promise<ExpenseApprovalRequestResult> {
  const res = await apiClient.post(`/expenses/${id}/approve/resend`, payload);
  return unwrap(res);
}

export async function confirmExpenseApproval(
  id: string,
  payload: { pendingId: string; code: string },
): Promise<unknown> {
  const res = await apiClient.post(`/expenses/${id}/approve/confirm`, payload);
  return unwrap(res);
}

export async function getExpense(id: string): Promise<ExpenseRecord> {
  const res = await apiClient.get(`/expenses/${id}`);
  return unwrap(res);
}
