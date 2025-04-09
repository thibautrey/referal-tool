import { Home, Link, BarChart3, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function SidebarMenuItems() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <NavLink to="/app/dashboard" end>
          {({ isActive }) => (
            <SidebarMenuButton
              tooltip="Home"
              isActive={isActive}
              className="w-full justify-start gap-3 px-3 py-2"
            >
              <Home className="h-5 w-5" />
              <span className="hidden lg:block">Dashboard</span>
            </SidebarMenuButton>
          )}
        </NavLink>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <NavLink to="/app/links">
          {({ isActive }) => (
            <SidebarMenuButton
              tooltip="Links"
              isActive={isActive}
              className="w-full justify-start gap-3 px-3 py-2"
            >
              <Link className="h-5 w-5" />
              <span className="hidden lg:block">Links</span>
            </SidebarMenuButton>
          )}
        </NavLink>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <NavLink to="/app/analytics">
          {({ isActive }) => (
            <SidebarMenuButton
              tooltip="Analytics"
              isActive={isActive}
              className="w-full justify-start gap-3 px-3 py-2"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="hidden lg:block">Analytics</span>
            </SidebarMenuButton>
          )}
        </NavLink>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <NavLink to="/app/settings">
          {({ isActive }) => (
            <SidebarMenuButton
              tooltip="Settings"
              isActive={isActive}
              className="w-full justify-start gap-3 px-3 py-2"
            >
              <Settings className="h-5 w-5" />
              <span className="hidden lg:block">Settings</span>
            </SidebarMenuButton>
          )}
        </NavLink>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
