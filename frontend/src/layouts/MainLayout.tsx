import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
// import { ThemeToggle } from "@/components/ThemeToggle";
import { ProjectSelector } from "@/components/project-selector";
import { UserInfoAndLogout } from "@/components/layout/UserInfoAndLogout";
import { SidebarMenuItems } from "@/components/layout/SidebarMenuItems";
import { News } from "@/components/layout/Sidebarnews";

export default function MainLayout() {
  const [isMounted, setIsMounted] = useState(false);

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
        <Sidebar className="flex-shrink-0 border-r fixed h-screen lg:w-[250px]">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-secondary/10 to-background animate-gradient-slow -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,53,255,0.1),rgba(255,255,255,0))] -z-10" />
          <SidebarHeader className="flex flex-col gap-2 border-b px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo.avif"
                  alt="rflnk Logo"
                  className="h-8 w-auto"
                />
                <h1 className="hidden font-semibold tracking-tight lg:block">
                  rflnk
                </h1>
              </div>
            </div>
            <ProjectSelector />
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarMenuItems />
          </SidebarContent>
          <SidebarFooter className="border-t">
            <News />
            <UserInfoAndLogout />
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
            <div className="w-full">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
