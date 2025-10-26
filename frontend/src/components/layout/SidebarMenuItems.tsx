import { Home, Link, BarChart3, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAppTranslation } from "@/i18n";

export function SidebarMenuItems() {
  const { t } = useAppTranslation();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <NavLink to="/app/dashboard" end>
          {({ isActive }) => (
            <SidebarMenuButton
              tooltip={t("sidebar.dashboard.tooltip")}
              isActive={isActive}
              className="w-full justify-start gap-3 px-3 py-2"
            >
              <Home className="h-5 w-5" />
              <span className="hidden lg:block">
                {t("sidebar.dashboard.label")}
              </span>
            </SidebarMenuButton>
          )}
        </NavLink>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <NavLink to="/app/links">
          {({ isActive }) => (
            <SidebarMenuButton
              tooltip={t("sidebar.links.tooltip")}
              isActive={isActive}
              className="w-full justify-start gap-3 px-3 py-2"
            >
              <Link className="h-5 w-5" />
              <span className="hidden lg:block">
                {t("sidebar.links.label")}
              </span>
            </SidebarMenuButton>
          )}
        </NavLink>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <NavLink to="/app/analytics">
          {({ isActive }) => (
            <SidebarMenuButton
              tooltip={t("sidebar.analytics.tooltip")}
              isActive={isActive}
              className="w-full justify-start gap-3 px-3 py-2"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="hidden lg:block">
                {t("sidebar.analytics.label")}
              </span>
            </SidebarMenuButton>
          )}
        </NavLink>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <NavLink to="/app/settings">
          {({ isActive }) => (
            <SidebarMenuButton
              tooltip={t("sidebar.settings.tooltip")}
              isActive={isActive}
              className="w-full justify-start gap-3 px-3 py-2"
            >
              <Settings className="h-5 w-5" />
              <span className="hidden lg:block">
                {t("sidebar.settings.label")}
              </span>
            </SidebarMenuButton>
          )}
        </NavLink>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
