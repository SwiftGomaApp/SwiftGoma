"use client";

import { io, type Socket } from "socket.io-client";

function getSocketOrigin() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return base.replace(/\/api\/v1\/?$/, "");
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getSocketOrigin(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }
  return socket;
}

export async function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
