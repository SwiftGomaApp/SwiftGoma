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
