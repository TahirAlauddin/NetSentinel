import type React from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";

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
      <div className="relative flex min-h-screen">
        <div className="hidden lg:block w-64 flex-shrink-0 overflow-visible">
          <Sidebar />
        </div>
        <div className="relative flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    </Suspense>
  );
}
