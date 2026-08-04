"use client";

import { useState } from "react";
import { ShieldCheck, Bell, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { SecurityPassword } from "@/components/settings/security-password";
import { SecurityTwoFactor } from "@/components/settings/security-two-factor";
import { SecurityPasskeys } from "@/components/settings/security-passkeys";
import { NotificationsPreferences } from "@/components/settings/notifications-preferences";
import { DevicesSessions } from "@/components/settings/devices-sessions";
import { SecurityPhone } from "@/components/settings/security-phone";
import { SecurityConnectedAccounts } from "@/components/settings/security-connected-accounts";

type Section = "security" | "notifications" | "devices";

const SECTIONS: { key: Section; label: string; icon: typeof ShieldCheck }[] = [
  { key: "security", label: "Sécurité", icon: ShieldCheck },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "devices", label: "Appareils et sessions", icon: Laptop },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("security");

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Paramètres
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez votre compte et vos préférences.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <nav className="shrink-0 lg:w-56">
          <ul className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.key;
              return (
                <li key={section.key}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(section.key)}
                    className={cn(
                      "flex w-full items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-muted text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          {activeSection === "security" && (
            <div className="flex flex-col gap-4">
              <SecurityPassword />
              <SecurityPhone />
              <SecurityConnectedAccounts />
              <SecurityTwoFactor />
              <SecurityPasskeys />
            </div>
          )}
          {activeSection === "notifications" && <NotificationsPreferences />}
          {activeSection === "devices" && <DevicesSessions />}
        </div>
      </div>
    </div>
  );
}
