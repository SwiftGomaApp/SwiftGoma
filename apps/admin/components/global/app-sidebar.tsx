"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/global/logo";
import { ModeToggle } from "@/components/global/theme-button";
import { NAV_GROUPS, ACCOUNT_NAV_ITEMS, type NavItem } from "@/lib/nav-config";
import { useAuth } from "@/providers/auth-provider";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { ui } from "@/lib/i18n/common";
import { labelOf, userRoleLabels } from "@/lib/i18n/labels";

function isItemVisible(item: NavItem, role: string | undefined): boolean {
  return role !== undefined && item.roles.includes(role as never);
}

export function AppSidebar() {
  const router = useRouter();
  const confirm = useConfirm();
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const pathname = usePathname();
  const role = user?.role;
  const isCollapsed = state === "collapsed";

  async function handleLogout() {
    const ok = await confirm({
      title: ui.logOut,
      description: "Voulez-vous terminer votre session sur cet appareil ?",
      confirmLabel: ui.logOut,
    });
    if (!ok) return;
    await logout();
    router.push("/auth/login");
  }

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isItemVisible(item, role)),
  })).filter((group) => group.items.length > 0);

  const visibleAccountItems = ACCOUNT_NAV_ITEMS.filter((item) =>
    isItemVisible(item, role),
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-center py-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
        <Logo
          href="/user"
          variant={isCollapsed ? "icon" : "full"}
          size={isCollapsed ? 20 : 18}
        />
      </SidebarHeader>

      <SidebarContent>
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={pathname === item.href}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {visibleAccountItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={pathname === item.href}
                render={<Link href={item.href} />}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-muted-foreground text-xs">{ui.theme}</span>
              <ModeToggle />
            </div>
          </SidebarMenuItem>
          {user && (
            <SidebarMenuItem>
              <div className="flex flex-col gap-2 px-2 py-1.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {labelOf(userRoleLabels, user.role)}
                  </p>
                </div>
                <SidebarMenuButton
                  tooltip={ui.logOut}
                  className="text-destructive hover:text-destructive w-full"
                  onClick={handleLogout}
                >
                  <LogOut />
                  <span>{ui.logOut}</span>
                </SidebarMenuButton>
              </div>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
