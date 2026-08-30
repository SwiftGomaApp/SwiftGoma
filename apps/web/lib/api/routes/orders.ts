import "server-only";

import { createServerApiClient } from "@/lib/api/server";
import type { OrderDetail, OrderListParams, OrderListResult } from "@/lib/orders";

export type {
  OrderStatus,
  BuyerOrderItem,
  BuyerOrder,
  OrderRider,
  OrderDetail,
  OrderListParams,
  OrderListPagination,
  OrderListResult,
} from "@/lib/orders";
export { RIDER_HOLDING_STATUSES } from "@/lib/orders";

type ApiEnvelope<T> = { success: boolean; data: T };

export async function getMyOrders(
  params: OrderListParams = {},
): Promise<OrderListResult> {
  const client = await createServerApiClient();
  const { data } = await client.get<ApiEnvelope<OrderListResult>>(
    "/orders/me",
    {
      params: {
        page: params.page,
        limit: params.limit,
        status: params.status,
      },
    },
  );
  return data.data;
}

export async function getOrder(orderId: string): Promise<OrderDetail> {
  const client = await createServerApiClient();
  const { data } = await client.get<ApiEnvelope<OrderDetail>>(
    `/orders/${encodeURIComponent(orderId)}`,
  );
  return data.data;
}
