export type OrderStatus =
  | "AWAITING_PAYMENT"
  | "PENDING_SELLER_REVIEW"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "RIDER_ASSIGNED"
  | "PICKED_UP"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

export type BuyerOrderItem = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  unitPrice: string;
  quantity: number;
  subtotal: string;
};

export type BuyerOrder = {
  id: string;
  shopId: string;
  shop: { name: string; slug: string };
  status: OrderStatus;
  paymentMethod: "CASH_ON_DELIVERY" | "ONLINE_PAYMENT";
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  currency: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  deliveryAddress: string | null;
  items: BuyerOrderItem[];
  createdAt: string;
};

export type OrderRider = {
  id: string;
  vehicleType: string | null;
  photoUrl: string | null;
  user: {
    id: string;
    name: string;
    phone: string | null;
    avatarUrl: string | null;
  };
};

export type OrderDetail = Omit<BuyerOrder, "shop"> & {
  shop: BuyerOrder["shop"] & {
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  rider: OrderRider | null;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  cancelReason: string | null;
  failureReason: string | null;
};

export type OrderListParams = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
};

export type OrderListPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type OrderListResult = {
  orders: BuyerOrder[];
  pagination: OrderListPagination;
};

// Statuses where a rider is actively holding the order — matches the
// server's own CHAT_ACTIVE_STATUSES (order.config.js), which is the
// platform's existing definition of "the rider has it right now." Kept in
// this plain (non "server-only") module since client components need the
// real runtime value, not just the type, to decide when to show the
// "Track order" button as live status updates come in over the socket.
export const RIDER_HOLDING_STATUSES: OrderStatus[] = [
  "RIDER_ASSIGNED",
  "PICKED_UP",
  "ON_THE_WAY",
];
