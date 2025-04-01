import { Home, LogOut, Menu, Settings } from "lucide-react";
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
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar>
          <SidebarHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-2">
              <img
                src="https://astronomy-store.com/cdn/shop/files/logo-insta.png?v=1720279381&width=120"
                alt="Referal Optimizer Logo"
                className="h-8 w-auto"
              />
              <h1 className="font-semibold tracking-tight">
                Referal Optimizer
              </h1>
            </div>
            {/* <SidebarTrigger /> */}
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavLink to="/" end>
                  {({ isActive }) => (
                    <SidebarMenuButton tooltip="Home" isActive={isActive}>
                      <Home />
                      <span>Home</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavLink to="/settings">
                  {({ isActive }) => (
                    <SidebarMenuButton tooltip="Settings" isActive={isActive}>
                      <Settings />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex flex-col p-4 gap-2">
              {user && (
                <div className="text-sm text-muted-foreground px-2 mb-2">
                  Welcome <span className="font-medium">{user.email}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              {/* <ThemeToggle /> */}
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex items-center gap-4 bg-background px-6">
            <Button variant="ghost" size="icon" className="md:hidden" asChild>
              <SidebarTrigger>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </SidebarTrigger>
            </Button>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
