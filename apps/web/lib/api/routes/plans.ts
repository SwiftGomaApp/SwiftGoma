import "server-only";

import { createServerApiClient } from "@/lib/api/server";

export type PublicPlanPrice = {
  id: string;
  billingCycle: "MONTHLY" | "YEARLY";
  currency: string;
  amount: string;
};

export type PublicPlan = {
  id: string;
  name: string;
  slug: string;
  maxProducts: number;
  maxPhotosPerProduct: number;
  maxShops: number;
  prioritySupport: boolean;
  sortOrder: number;
  prices: PublicPlanPrice[];
};

type ApiEnvelope<T> = { success: boolean; data: T };

export async function getPublicPlans(): Promise<PublicPlan[]> {
  const client = await createServerApiClient();
  const { data } = await client.get<ApiEnvelope<PublicPlan[]>>("/plans");
  return data.data;
}
