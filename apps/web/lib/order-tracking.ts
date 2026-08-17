import type { OrderMessage } from "./api/routes/orders";

export type LiveLocation = {
  role?: "BUYER" | "RIDER";
  latitude: number;
  longitude: number;
  timestamp: string;
};

export type OrderJoinAck = {
  role?: "BUYER" | "RIDER" | "SELLER";
  lastKnown?: {
    buyer: LiveLocation | null;
    rider: LiveLocation | null;
  };
  error?: string;
};

export type OrderMessageSendAck =
  | { message: OrderMessage; error?: undefined }
  | { error: string; message?: string };

export type OrderMessageReadAck =
  | { ok: true; error?: undefined }
  | { error: string; message?: string };
