"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/providers/socket-provider";
import type { LiveLocation, OrderJoinAck } from "@/lib/order-tracking";

export function useOrderTracking(orderId: string, enabled: boolean) {
  const { socket, isConnected } = useSocket();
  const [riderLocation, setRiderLocation] = useState<LiveLocation | null>(null);
  const [buyerLiveLocation, setBuyerLiveLocation] = useState<LiveLocation | null>(
    null,
  );
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !enabled || !isConnected) return;

    setJoinError(null);
    setJoined(false);

    socket.emit("order:join", orderId, (ack: OrderJoinAck) => {
      if (ack?.error) {
        setJoinError("Impossible de rejoindre le suivi en direct.");
        return;
      }
      if (ack?.lastKnown?.rider) setRiderLocation(ack.lastKnown.rider);
      if (ack?.lastKnown?.buyer) setBuyerLiveLocation(ack.lastKnown.buyer);
      setJoined(true);
    });

    function onLocation(payload: LiveLocation & { role: "BUYER" | "RIDER" }) {
      if (payload.role === "RIDER") {
        setRiderLocation({
          latitude: payload.latitude,
          longitude: payload.longitude,
          timestamp: payload.timestamp,
        });
      }
      if (payload.role === "BUYER") {
        setBuyerLiveLocation({
          latitude: payload.latitude,
          longitude: payload.longitude,
          timestamp: payload.timestamp,
        });
      }
    }

    socket.on("location:update", onLocation);

    return () => {
      socket.emit("order:leave", orderId);
      socket.off("location:update", onLocation);
    };
  }, [socket, isConnected, orderId, enabled]);

  useEffect(() => {
    if (!enabled || !socket?.connected || !joined) return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        socket.emit("location:update", {
          orderId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 15000, timeout: 12000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, orderId, enabled, joined]);

  return {
    riderLocation,
    buyerLiveLocation,
    joined,
    joinError,
    isLive: isConnected && joined,
  };
}
