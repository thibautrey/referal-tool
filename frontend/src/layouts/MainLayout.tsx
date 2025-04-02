import { BarChart3, Home, Link, LogOut, Menu, Settings } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
// import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export default function MainLayout() {
  const [isMounted, setIsMounted] = useState(false);
  const { user, logout } = useAuth();

  // Prevent hydration errors with server-side rendering differences
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full overflow-hidden bg-background">
        <Sidebar className="flex-shrink-0 border-r">
          <SidebarHeader className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-3">
              <img
                src="https://astronomy-store.com/cdn/shop/files/logo-insta.png?v=1720279381&width=120"
                alt="Referal Optimizer Logo"
                className="h-8 w-auto"
              />
              <h1 className="hidden font-semibold tracking-tight lg:block">
                Referal Optimizer
              </h1>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <NavLink to="/" end>
                  {({ isActive }) => (
                    <SidebarMenuButton
                      tooltip="Home"
                      isActive={isActive}
                      className="w-full justify-start gap-3 px-3 py-2"
                    >
                      <Home className="h-5 w-5" />
                      <span className="hidden lg:block">Home</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavLink to="/links">
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
                <NavLink to="/analytics">
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
                <NavLink to="/settings">
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
          </SidebarContent>
          <SidebarFooter className="border-t">
            <div className="flex flex-col gap-2 p-4">
              {user && (
                <div className="text-sm text-muted-foreground px-2 mb-2">
                  <span className="hidden lg:inline">Welcome </span>
                  <span className="font-medium">{user.email}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-3"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:block">Logout</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex w-full flex-col">
          <header className="sticky top-0 z-10 flex items-center border-b bg-background px-4">
            <Button variant="ghost" size="icon" className="lg:hidden" asChild>
              <SidebarTrigger>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </SidebarTrigger>
            </Button>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
