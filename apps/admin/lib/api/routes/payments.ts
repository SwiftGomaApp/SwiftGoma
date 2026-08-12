import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";

// ---------------------------------------------------------------------------
// PawaPay (subscription payments) — ADMIN only on the backend
// ---------------------------------------------------------------------------

export async function initiatePawaPayDeposit(input: {
  amount: number;
  currency: string;
  country: string;
  provider: string;
  payerPhoneNumber: string;
  customerMessage: string;
  clientReferenceId?: string;
}): Promise<unknown> {
  const res = await apiClient.post("/pawapay/deposits", input);
  return unwrap(res);
}

export async function getPawaPayDepositStatus(depositId: string): Promise<unknown> {
  const res = await apiClient.get(`/pawapay/deposits/${depositId}`);
  return unwrap(res);
}

export async function initiatePawaPayPayout(input: {
  amount: number;
  currency: string;
  country: string;
  provider: string;
  recipientPhoneNumber: string;
  customerMessage: string;
  clientReferenceId?: string;
}): Promise<unknown> {
  const res = await apiClient.post("/pawapay/payouts", input);
  return unwrap(res);
}

export interface PawaPayPayoutApprovalSummary {
  amount: number;
  currency: string;
  country: string;
  provider: string;
  recipientPhoneNumber: string;
}

export async function requestPawaPayPayoutApproval(input: {
  amount: number;
  currency: string;
  country: string;
  provider: string;
  recipientPhoneNumber: string;
  customerMessage: string;
  clientReferenceId?: string;
}): Promise<{
  pendingId: string;
  message: string;
  expiresInMinutes: number;
  summary: PawaPayPayoutApprovalSummary;
}> {
  const res = await apiClient.post("/pawapay/payouts/request-approval", input);
  return unwrap(res);
}

export async function confirmPawaPayPayout(input: {
  pendingId: string;
  code: string;
}): Promise<unknown> {
  const res = await apiClient.post("/pawapay/payouts/confirm", input);
  return unwrap(res);
}

export async function getPawaPayPayoutHistory(params: {
  page?: number;
  limit?: number;
} = {}): Promise<AdminPayoutHistoryResponse> {
  const res = await apiClient.get("/pawapay/payouts/history", { params });
  return unwrap(res);
}

export interface AdminPayoutRecord {
  id: string;
  provider: "PAWAPAY" | "MBIYOPAY";
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  amount: string;
  currency: string;
  beneficiary: string | null;
  phoneNumber: string | null;
  network: string | null;
  countryCode: string | null;
  providerName: string | null;
  externalId: string | null;
  externalStatus: string | null;
  failureReason: string | null;
  createdAt: string;
  admin: { id: string; name: string };
}

export interface AdminPayoutHistoryResponse {
  items: AdminPayoutRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getPawaPayPayoutStatus(payoutId: string): Promise<unknown> {
  const res = await apiClient.get(`/pawapay/payouts/${payoutId}`);
  return unwrap(res);
}

export async function initiatePawaPayRefund(input: {
  depositId: string;
  amount?: number;
  currency?: string;
  country?: string;
  provider?: string;
}): Promise<unknown> {
  const res = await apiClient.post("/pawapay/refunds", input);
  return unwrap(res);
}

export async function getPawaPayRefundStatus(refundId: string): Promise<unknown> {
  const res = await apiClient.get(`/pawapay/refunds/${refundId}`);
  return unwrap(res);
}

export interface PawaPayWalletBalance {
  currency: string;
  amount: string;
}

export async function getPawaPayBalances(): Promise<{
  balances: PawaPayWalletBalance[];
}> {
  const res = await apiClient.get("/pawapay/wallet-balances");
  return unwrap(res);
}

export async function getPawaPayActiveConfiguration(params: {
  country?: string;
  operationType?: string;
  currency?: string;
} = {}): Promise<unknown> {
  const res = await apiClient.get("/pawapay/active-configuration", { params });
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// MbiyoPay (order payments) — ADMIN only on the backend
// ---------------------------------------------------------------------------

export async function initiateMbiyoPayPayin(input: {
  amount: number;
  currency: string;
  network: string;
  phoneNumber: string;
  countryCode: string;
  orderId?: string;
}): Promise<unknown> {
  const res = await apiClient.post("/mbiyopay/payin", input);
  return unwrap(res);
}

export async function initiateMbiyoPayPayout(input: {
  amount: number;
  currency: string;
  network: string;
  phoneNumber: string;
  countryCode: string;
  beneficiary: string;
  orderId?: string;
}): Promise<unknown> {
  const res = await apiClient.post("/mbiyopay/payout", input);
  return unwrap(res);
}

export interface MbiyoPayPayoutApprovalSummary {
  amount: number;
  currency: string;
  beneficiary: string;
  phoneNumber: string;
  network: string;
}

export async function requestMbiyoPayPayoutApproval(input: {
  amount: number;
  currency: string;
  network: string;
  phoneNumber: string;
  countryCode: string;
  beneficiary: string;
  orderId?: string;
}): Promise<{
  pendingId: string;
  message: string;
  expiresInMinutes: number;
  summary: MbiyoPayPayoutApprovalSummary;
}> {
  const res = await apiClient.post("/mbiyopay/payout/request-approval", input);
  return unwrap(res);
}

export async function confirmMbiyoPayPayout(input: {
  pendingId: string;
  code: string;
}): Promise<unknown> {
  const res = await apiClient.post("/mbiyopay/payout/confirm", input);
  return unwrap(res);
}

export async function getMbiyoPayPayoutHistory(params: {
  page?: number;
  limit?: number;
} = {}): Promise<AdminPayoutHistoryResponse> {
  const res = await apiClient.get("/mbiyopay/payout/history", { params });
  return unwrap(res);
}

export async function getMbiyoPayTransactionStatus(
  transactionId: string,
): Promise<unknown> {
  const res = await apiClient.get(`/mbiyopay/transactions/${transactionId}`);
  return unwrap(res);
}

export async function getMbiyoPayBalances(currency?: string): Promise<unknown> {
  const res = await apiClient.get("/mbiyopay/balances", {
    params: currency ? { currency } : undefined,
  });
  return unwrap(res);
}

export async function getMbiyoPayNetworkBalances(params: {
  currency?: string;
  countryCode?: string;
} = {}): Promise<unknown> {
  const res = await apiClient.get("/mbiyopay/balances/networks", { params });
  return unwrap(res);
}

export async function getMbiyoPayCountries(all = true): Promise<unknown> {
  const res = await apiClient.get("/mbiyopay/countries", {
    params: all ? { all: "true" } : undefined,
  });
  return unwrap(res);
}

export async function getAdminTransactions(params: {
  page?: number;
  limit?: number;
  provider?: "PAWAPAY" | "MBIYOPAY" | "";
  status?: AdminPayoutRecord["status"] | "";
  search?: string;
} = {}): Promise<AdminPayoutHistoryResponse> {
  const res = await apiClient.get("/payments/transactions", {
    params: {
      page: params.page,
      limit: params.limit,
      provider: params.provider || undefined,
      status: params.status || undefined,
      search: params.search?.trim() || undefined,
    },
  });
  return unwrap(res);
}

export type PaymentLedgerSource =
  | "ADMIN_PAYOUT"
  | "SUBSCRIPTION_PAYMENT"
  | "ORDER_PAYMENT"
  | "EXPENSE";

export interface PaymentLedgerEntry {
  id: string;
  source: PaymentLedgerSource;
  direction: "IN" | "OUT";
  amount: string;
  currency: string;
  status: string;
  reference: string;
  label: string;
  provider: string | null;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface PaymentLedgerResponse {
  items: PaymentLedgerEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getPaymentLedger(params: {
  page?: number;
  limit?: number;
  source?: PaymentLedgerSource | "";
  direction?: "IN" | "OUT" | "";
  status?: string;
  search?: string;
} = {}): Promise<PaymentLedgerResponse> {
  const res = await apiClient.get("/payments/ledger", {
    params: {
      page: params.page,
      limit: params.limit,
      source: params.source || undefined,
      direction: params.direction || undefined,
      status: params.status || undefined,
      search: params.search?.trim() || undefined,
    },
  });
  return unwrap(res);
}
