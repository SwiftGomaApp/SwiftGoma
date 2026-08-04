"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "@/lib/toast";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/providers/auth-provider";
import type { Notification } from "@/lib/api/routes/notifications";

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    if (!user) {
      if (socket.connected) socket.disconnect();
      return;
    }

    socket.connect();

    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }
    function onConnectError(err: Error) {
      console.warn("[socket] connection error:", err.message);
    }
    function onNewNotification(notification: Notification) {
      toast.info(notification.title);
      window.dispatchEvent(
        new CustomEvent("notification:new", { detail: notification }),
      );
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("notification:new", onNewNotification);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("notification:new", onNewNotification);
      socket.disconnect();
    };
  }, [user, socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
