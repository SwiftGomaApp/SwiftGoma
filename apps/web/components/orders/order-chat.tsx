"use client";

import React, { useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { useAuth } from "@/providers/auth-provider";
import { useOrderMessages } from "@/hooks/use-order-messages";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

function formatMessageTime(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

type OrderChatProps = {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manageRoom?: boolean;
};

export function OrderChat({
  orderId,
  open,
  onOpenChange,
  manageRoom = true,
}: OrderChatProps) {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const { messages, isLoadingHistory, isSending, sendMessage, markAsRead } =
    useOrderMessages(orderId, { enabled: open, manageRoom });

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next) markAsRead();
  }

  async function handleSend() {
    const body = draft.trim();
    if (!body || isSending) return;

    const result = await sendMessage(body);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto flex h-[75vh] w-full max-w-lg flex-col rounded-t-2xl sm:h-[70vh]"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Message au livreur
          </SheetTitle>
          <SheetDescription>
            Disponible pendant la livraison, pour coordonner la remise.
          </SheetDescription>
        </SheetHeader>

        <MessageScrollerProvider>
          <MessageScroller className="flex-1 min-h-0 px-4">
            <MessageScrollerViewport>
              <MessageScrollerContent>
                {isLoadingHistory && (
                  <div className="flex flex-1 items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!isLoadingHistory && messages.length === 0 && (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <MessageCircle />
                      </EmptyMedia>
                      <EmptyTitle>Aucun message</EmptyTitle>
                      <EmptyDescription>
                        Dites bonjour à votre livreur, ou précisez des
                        instructions pour la remise.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}

                {messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <MessageScrollerItem key={message.id}>
                      <Message align={isOwn ? "end" : "start"}>
                        <MessageContent>
                          <Bubble
                            align={isOwn ? "end" : "start"}
                            variant={isOwn ? "default" : "secondary"}
                          >
                            <BubbleContent>{message.body}</BubbleContent>
                          </Bubble>
                          <MessageFooter
                            className={cn(!isOwn && "justify-start")}
                          >
                            {formatMessageTime(message.createdAt)}
                          </MessageFooter>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  );
                })}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        <SheetFooter className="flex-row items-end gap-2 border-t">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez un message…"
            className="min-h-10 flex-1 resize-none"
            maxLength={1000}
          />
          <Button
            type="button"
            size="icon"
            disabled={!draft.trim() || isSending}
            onClick={handleSend}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
