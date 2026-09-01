"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import type { OrderDetail, OrderStatus } from "@/lib/orders";
import {
  getOrderMessages,
  type OrderMessage,
} from "@/lib/api/routes/orders.routes";

const CHAT_ACTIVE_STATUSES: OrderStatus[] = [
  "RIDER_ASSIGNED",
  "PICKED_UP",
  "ON_THE_WAY",
];

type Locale = "en" | "fr";

const STRINGS: Record<
  Locale,
  {
    title: string;
    placeholder: string;
    send: string;
    empty: string;
    unavailable: string;
    connecting: string;
    you: string;
    seller: string;
    rider: string;
  }
> = {
  en: {
    title: "Order chat",
    placeholder: "Type a message…",
    send: "Send",
    empty: "No messages yet.",
    unavailable: "Chat opens once a rider is assigned to your order.",
    connecting: "Connecting…",
    you: "You",
    seller: "Seller",
    rider: "Rider",
  },
  fr: {
    title: "Discussion de commande",
    placeholder: "Écrire un message…",
    send: "Envoyer",
    empty: "Aucun message pour le moment.",
    unavailable:
      "La discussion s'ouvre une fois un livreur assigné à votre commande.",
    connecting: "Connexion…",
    you: "Vous",
    seller: "Vendeur",
    rider: "Livreur",
  },
};

function getSocketOrigin() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return base.replace(/\/api\/v1\/?$/, "");
}

function formatTime(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function OrderChat({
  order,
  locale,
}: {
  order: OrderDetail;
  locale: Locale;
}) {
  const t = STRINGS[locale];
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const highlightMessageId = searchParams.get("messageId");

  const isActive = CHAT_ACTIVE_STATUSES.includes(order.status) && !!order.rider;

  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getOrderMessages(order.id)
      .then(setMessages)
      .catch(() => {});
  }, [order.id]);

  useEffect(() => {
    if (!isActive) return;

    const socket = io(getSocketOrigin(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("order:join", order.id);
      socket.emit("order:message:read", order.id);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("order:message:new", (message: OrderMessage) => {
      if (message.orderId !== order.id) return;
      setMessages((prev) => [...prev, message]);
      if (message.senderId !== user?.id) {
        socket.emit("order:message:read", order.id);
      }
    });

    socket.on(
      "order:message:read",
      (payload: { orderId: string; readBy: string }) => {
        if (payload.orderId !== order.id) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === user?.id && !m.readAt
              ? { ...m, readAt: new Date().toISOString() }
              : m,
          ),
        );
      },
    );

    return () => {
      socket.emit("order:leave", order.id);
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id, isActive]);

  useEffect(() => {
    if (highlightMessageId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ block: "center" });
      return;
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, highlightMessageId]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !socketRef.current || sending) return;

    setSending(true);
    socketRef.current.emit(
      "order:message:send",
      { orderId: order.id, body },
      (ack: { message?: OrderMessage; error?: string }) => {
        setSending(false);
        if (ack?.message) setDraft("");
      },
    );
  }

  if (messages.length === 0 && !isActive) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">{t.title}</h2>

      <div
        ref={listRef}
        className="mt-4 flex max-h-80 flex-col gap-2 overflow-y-auto"
      >
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t.empty}
          </p>
        )}
        {messages.map((message) => {
          const isMine = message.senderId === user?.id;
          const isHighlighted = message.id === highlightMessageId;
          return (
            <div
              key={message.id}
              ref={isHighlighted ? highlightRef : undefined}
              className={cn("flex", isMine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                  isMine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                  isHighlighted && "ring-2 ring-primary",
                )}
              >
                <p>{message.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    isMine
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {isMine
                    ? t.you
                    : message.senderRole === "SELLER"
                      ? t.seller
                      : t.rider}{" "}
                  · {formatTime(message.createdAt, locale)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {isActive ? (
        <form onSubmit={handleSend} className="mt-4 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={connected ? t.placeholder : t.connecting}
            disabled={!connected}
            maxLength={1000}
            className="h-9 flex-1 rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!connected || !draft.trim() || sending}
          >
            <Send className="size-4" />
          </Button>
        </form>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">{t.unavailable}</p>
      )}
    </div>
  );
}

export default OrderChat;
