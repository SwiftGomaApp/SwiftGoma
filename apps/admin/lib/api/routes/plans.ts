import { apiClient } from "@/lib/api/client";
import { unwrap } from "@/lib/api/utils";

export type BillingCycle = "MONTHLY" | "YEARLY";

export interface PlanPrice {
  id: string;
  planId: string;
  billingCycle: BillingCycle;
  currency: string;
  amount: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  maxProducts: number;
  maxPhotosPerProduct: number;
  maxShops: number;
  prioritySupport: boolean;
  isActive: boolean;
  sortOrder: number;
  prices: PlanPrice[];
}

export async function listPlans(includeInactive = true): Promise<Plan[]> {
  const res = await apiClient.get("/plans", {
    params: includeInactive ? { includeInactive: "true" } : undefined,
  });
  return unwrap(res);
}

export async function createPlan(input: {
  slug: string;
  name: string;
  maxProducts: number;
  maxPhotosPerProduct: number;
  maxShops?: number;
  prioritySupport?: boolean;
  sortOrder?: number;
}): Promise<Plan> {
  const res = await apiClient.post("/plans", input);
  return unwrap(res);
}

export async function updatePlan(
  id: string,
  input: Partial<{
    name: string;
    maxProducts: number;
    maxPhotosPerProduct: number;
    maxShops: number;
    prioritySupport: boolean;
    isActive: boolean;
    sortOrder: number;
  }>,
): Promise<Plan> {
  const res = await apiClient.put(`/plans/${id}`, input);
  return unwrap(res);
}

export async function updatePlanPrice(
  planId: string,
  input: { billingCycle: BillingCycle; currency: string; amount: number },
): Promise<PlanPrice> {
  const res = await apiClient.put(`/plans/${planId}/prices`, input);
  return unwrap(res);
}

export async function setPlanActive(
  id: string,
  isActive: boolean,
): Promise<Plan> {
  const res = await apiClient.post(`/plans/${id}/active`, { isActive });
  return unwrap(res);
}
