"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { OrderStatus } from "@/lib/orders";

function getSocketOrigin() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return base.replace(/\/api\/v1\/?$/, "");
}

export type RiderLocation = {
  latitude: number;
  longitude: number;
  timestamp: string;
};

export function useOrderTracking(orderId: string, enabled: boolean) {
  const [connected, setConnected] = useState(false);
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(
    null,
  );
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const socket = io(getSocketOrigin(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit(
        "order:join",
        orderId,
        (ack?: { lastKnown?: { rider?: RiderLocation | null } }) => {
          if (ack?.lastKnown?.rider) setRiderLocation(ack.lastKnown.rider);
        },
      );
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on(
      "order:status",
      (payload: { orderId: string; status: OrderStatus }) => {
        if (payload.orderId === orderId) setStatus(payload.status);
      },
    );

    socket.on(
      "location:update",
      (payload: {
        role: string;
        latitude: number;
        longitude: number;
        timestamp: string;
      }) => {
        if (payload.role === "RIDER") {
          setRiderLocation({
            latitude: payload.latitude,
            longitude: payload.longitude,
            timestamp: payload.timestamp,
          });
        }
      },
    );

    return () => {
      socket.emit("order:leave", orderId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId, enabled]);

  return { connected, riderLocation, status };
}
5