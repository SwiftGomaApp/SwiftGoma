"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./auth";
import type { OrderStatus } from "./api";

function getSocketOrigin() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return base.replace(/\/api\/v1\/?$/, "");
}

export function useDeliverySocket(orderId: string | null) {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const token = getAccessToken();
    if (!token) return;

    const socket = io(getSocketOrigin(), {
      transports: ["websocket", "polling"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("order:join", orderId);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on(
      "order:status",
      (payload: { orderId: string; status: OrderStatus }) => {
        if (payload.orderId === orderId) setStatus(payload.status);
      },
    );

    return () => {
      socket.emit("order:leave", orderId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId]);

  function emitLocation(latitude: number, longitude: number) {
    if (!orderId) return;
    socketRef.current?.emit("location:update", {
      orderId,
      latitude,
      longitude,
    });
  }

  return { connected, status, emitLocation };
}
