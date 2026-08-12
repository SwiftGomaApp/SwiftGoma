"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationsInbox } from "@/components/admin/notifications-inbox";
import { SendNotificationForm } from "@/components/admin/send-notification-form";
import { useSocket } from "@/providers/socket-provider";
import { isOneSignalConfigured } from "@/lib/onesignal";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { isConnected } = useSocket();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Notifications</h1>
        <p className="text-muted-foreground text-sm">
          Alertes dans l'application via Socket.io
          {isOneSignalConfigured() ? ", notifications push du navigateur via OneSignal" : ""}.
          {" "}
          <span
            className={cn(
              isConnected ? "text-emerald-600" : "text-muted-foreground",
            )}
          >
            {isConnected
              ? "Connecté en direct."
              : "Temps réel hors ligne — actualisez la page pour vous reconnecter."}
          </span>
        </p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Boîte de réception</TabsTrigger>
          <TabsTrigger value="send">Envoyer à un utilisateur</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="mt-4">
          <NotificationsInbox />
        </TabsContent>
        <TabsContent value="send" className="mt-4">
          <SendNotificationForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
