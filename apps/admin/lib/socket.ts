import { io, type Socket } from "socket.io-client";
import { resolveSocketUrl, usesSameOriginSocket } from "@/lib/resolve-socket-url";

const NGROK_POLLING_HEADERS = {
  "ngrok-skip-browser-warning": "1",
};

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const transports = usesSameOriginSocket()
      ? (["polling"] as const)
      : (["polling", "websocket"] as const);

    socket = io(resolveSocketUrl(), {
      withCredentials: true,
      autoConnect: false,
      transports: [...transports],
      transportOptions: {
        polling: { extraHeaders: NGROK_POLLING_HEADERS },
      },
    });
  }
  return socket;
}
