import type React from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";

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
    <Suspense fallback={null}>
      <div className="flex h-screen overflow-hidden">
        <div className="hidden lg:block w-64 flex-shrink-0 overflow-visible">
          <Sidebar />
        </div>
        <main className="w-full grid grid-cols-1 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </Suspense>
  );
}
