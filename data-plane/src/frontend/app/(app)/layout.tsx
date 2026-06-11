import type React from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { RoutePermissionGuard } from "@/components/auth/route-permission-guard";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { AppLayoutSidebar } from "@/components/layout/app-layout-sidebar";

export const metadata: Metadata = {
  title: "NetSentinel Dashboard",
  description: "NetSentinel Network Operations Dashboard",
};

export default function AppLayout({
  children,

}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoutePermissionGuard>
      <SidebarProvider>
        <Suspense fallback={null}>
          <div className="flex h-screen overflow-hidden">
            <AppLayoutSidebar />
            <main className="w-full grid grid-cols-1 min-h-0 overflow-y-auto">
              {children}
            </main>
          </div>
        </Suspense>
      </SidebarProvider>
    </RoutePermissionGuard>
  );
}
