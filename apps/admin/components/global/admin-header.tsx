"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationsPanel } from "@/components/global/notifications-panel";
import { PushNotificationsToggle } from "@/components/global/push-notifications-toggle";
import { useSocket } from "@/providers/socket-provider";
import { cn } from "@/lib/utils";
import { ui } from "@/lib/i18n/common";

export function AdminHeader() {
  const { isConnected } = useSocket();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center justify-end gap-2">
        {mounted && (
          <span
            className={cn(
              "hidden items-center gap-1.5 text-xs sm:flex",
              isConnected ? "text-emerald-600" : "text-muted-foreground",
            )}
            title={
              isConnected
                ? "Temps réel connecté"
                : "Temps réel déconnecté"
            }
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isConnected ? "bg-emerald-500" : "bg-muted-foreground/50",
              )}
            />
            {isConnected ? ui.live : ui.offline}
          </span>
        )}
        <PushNotificationsToggle />
        <NotificationsPanel />
      </div>
    </header>
  );
}
