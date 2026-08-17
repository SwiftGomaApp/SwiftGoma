"use client";

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/providers/socket-provider";
import { useAuth } from "@/providers/auth-provider";
import { ordersApi, type OrderMessage } from "@/lib/api/routes/orders";
import { ApiException } from "@/lib/api";
import type { OrderMessageSendAck } from "@/lib/order-tracking";

type UseOrderMessagesOptions = {
  enabled: boolean;
  manageRoom?: boolean;
};

export function useOrderMessages(
  orderId: string,
  { enabled, manageRoom = true }: UseOrderMessagesOptions,
) {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Initial history load.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    setIsLoadingHistory(true);
    setHistoryError(null);

    ordersApi
      .getOrderMessages(orderId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch((err) => {
        if (cancelled) return;
        setHistoryError(
          err instanceof ApiException
            ? err.message
            : "Impossible de charger les messages.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, enabled]);

  // Room join + realtime listeners.
  useEffect(() => {
    if (!socket || !enabled || !isConnected) return;

    if (manageRoom) {
      socket.emit("order:join", orderId);
    }

    function onNewMessage(message: OrderMessage) {
      if (message.orderId !== orderId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message],
      );
    }

    function onRead({ readBy }: { orderId: string; readBy: string }) {
      if (readBy === user?.id) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === user?.id && !m.readAt
            ? { ...m, readAt: new Date().toISOString() }
            : m,
        ),
      );
    }

    socket.on("order:message:new", onNewMessage);
    socket.on("order:message:read", onRead);

    return () => {
      socket.off("order:message:new", onNewMessage);
      socket.off("order:message:read", onRead);
      if (manageRoom) {
        socket.emit("order:leave", orderId);
      }
    };
  }, [socket, isConnected, enabled, orderId, manageRoom, user?.id]);

  const sendMessage = useCallback(
    (body: string) => {
      const trimmed = body.trim();
      if (!trimmed || !socket?.connected) {
        return Promise.resolve({
          ok: false as const,
          error: "Connexion indisponible. Réessayez.",
        });
      }

      setIsSending(true);
      return new Promise<{ ok: true } | { ok: false; error: string }>(
        (resolve) => {
          socket.emit(
            "order:message:send",
            { orderId, body: trimmed },
            (ack: OrderMessageSendAck) => {
              setIsSending(false);
              if (ack?.error) {
                resolve({
                  ok: false,
                  error: ack.message ?? "Impossible d'envoyer le message.",
                });
                return;
              }
              resolve({ ok: true });
            },
          );
        },
      );
    },
    [socket, orderId],
  );

  const markAsRead = useCallback(() => {
    if (!socket?.connected) return;
    socket.emit("order:message:read", orderId);
    setMessages((prev) =>
      prev.map((m) =>
        m.senderId !== user?.id && !m.readAt
          ? { ...m, readAt: new Date().toISOString() }
          : m,
      ),
    );
  }, [socket, orderId, user?.id]);

  const unreadCount = messages.filter(
    (m) => m.senderId !== user?.id && !m.readAt,
  ).length;

  return {
    messages,
    isLoadingHistory,
    historyError,
    isSending,
    unreadCount,
    sendMessage,
    markAsRead,
  };
}
